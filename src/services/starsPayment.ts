import { UserSubscription, StarsTariff } from '../types';
import { tg } from './telegram';

const STORAGE_KEYS = {
  SUBSCRIPTION: 'dayflow_user_subscription_v1',
  ADMIN_GRANTED_VIPS: 'dayflow_admin_granted_vips_v1',
  ADMIN_PROMOCODES: 'dayflow_admin_promocodes_v1',
};

// Список ID разработчиков (супер-админов)
export const DEFAULT_ADMIN_IDS: string[] = [
  '8875277564', // ID создателя бота
];

export interface GrantedVipUser {
  userId: string;
  name?: string;
  grantedAt: string;
  expiresAt: string; // ISO or 'forever'
  note?: string;
}

export interface PromoCode {
  code: string;
  durationDays: number; // 30, 365, or 9999 for forever
  isUsed: boolean;
  usedBy?: string;
}

export const STARS_TARIFFS: StarsTariff[] = [
  {
    id: 'pro_monthly',
    title: 'Voice Brain Pro — 1 месяц',
    starsAmount: 149,
    description: 'Безлимитный голосовой ввод, умный разбор потока мыслей и приоритетный утренний AI-план дня.',
    badge: 'ХИТ ⭐',
    type: 'subscription',
    durationDays: 30,
  },
  {
    id: 'pack_25',
    title: 'Пакет: 25 голосовых разборов',
    starsAmount: 50,
    description: 'Разовый пакет запросов без срока действия. Тратьте когда удобно.',
    type: 'package',
    bonusRequests: 25,
  },
];

export class StarsPaymentService {
  private getStartOfWeekISO(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }

  public getSubscription(): UserSubscription {
    const defaultSub: UserSubscription = {
      isPro: false,
      freeVoiceRequestsUsed: 0,
      freeVoiceRequestsLimit: 5,
      bonusRequests: 0,
      weekResetDate: this.getStartOfWeekISO(),
    };

    if (typeof window === 'undefined') return defaultSub;

    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
      let parsed: UserSubscription = raw ? JSON.parse(raw) : defaultSub;

      // Проверяем, не входит ли текущий пользователь в список выданных VIP
      const currentUser = tg.getUser();
      const currentUserId = currentUser?.id ? String(currentUser.id) : '';
      if (currentUserId && this.isUserInVipList(currentUserId)) {
        parsed.isPro = true;
      }

      // Проверяем срок Pro подписки
      if (parsed.isPro && parsed.proExpiresAt && parsed.proExpiresAt !== 'forever') {
        const expires = new Date(parsed.proExpiresAt).getTime();
        if (Date.now() > expires) {
          parsed.isPro = false;
        }
      }

      // Проверяем сброс недели для бесплатных запросов
      const currentWeekStart = this.getStartOfWeekISO();
      if (parsed.weekResetDate !== currentWeekStart) {
        parsed.freeVoiceRequestsUsed = 0;
        parsed.weekResetDate = currentWeekStart;
        this.saveSubscription(parsed);
      }

      return parsed;
    } catch {
      return defaultSub;
    }
  }

  public saveSubscription(sub: UserSubscription): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(sub));
  }

  public canUseVoiceBrain(): { allowed: boolean; remaining: number; isPro: boolean } {
    const sub = this.getSubscription();
    if (sub.isPro) {
      return { allowed: true, remaining: 9999, isPro: true };
    }

    const freeRemaining = Math.max(0, sub.freeVoiceRequestsLimit - sub.freeVoiceRequestsUsed);
    const totalRemaining = freeRemaining + sub.bonusRequests;

    return {
      allowed: totalRemaining > 0,
      remaining: totalRemaining,
      isPro: false,
    };
  }

  public consumeVoiceRequest(): boolean {
    const sub = this.getSubscription();
    if (sub.isPro) return true;

    if (sub.bonusRequests > 0) {
      sub.bonusRequests -= 1;
      this.saveSubscription(sub);
      return true;
    }

    if (sub.freeVoiceRequestsUsed < sub.freeVoiceRequestsLimit) {
      sub.freeVoiceRequestsUsed += 1;
      this.saveSubscription(sub);
      return true;
    }

    return false;
  }

  public async purchaseTariff(tariffId: string): Promise<{ success: boolean; error?: string }> {
    const tariff = STARS_TARIFFS.find(t => t.id === tariffId);
    if (!tariff) return { success: false, error: 'Тариф не найден' };

    tg.haptic('impact', 'medium');
    this.applyTariffSuccess(tariff);
    return { success: true };
  }

  private applyTariffSuccess(tariff: StarsTariff): void {
    const sub = this.getSubscription();

    if (tariff.type === 'subscription') {
      sub.isPro = true;
      const days = tariff.durationDays || 30;
      const expires = new Date();
      expires.setDate(expires.getDate() + days);
      sub.proExpiresAt = expires.toISOString();
    } else if (tariff.type === 'package') {
      sub.bonusRequests += tariff.bonusRequests || 25;
    }

    this.saveSubscription(sub);
    tg.haptic('notification', 'success');
  }

  // ==========================================
  // 👑 АДМИН-ФУНКЦИИ И ВЫДАЧА VIP
  // ==========================================

  // Выдать VIP себе
  public grantProToSelf(durationDays: number = 9999): void {
    const sub = this.getSubscription();
    sub.isPro = true;
    if (durationDays >= 9999) {
      sub.proExpiresAt = 'forever';
    } else {
      const expires = new Date();
      expires.setDate(expires.getDate() + durationDays);
      sub.proExpiresAt = expires.toISOString();
    }
    this.saveSubscription(sub);
    tg.haptic('notification', 'success');
  }

  // Сбросить свой VIP
  public revokeProFromSelf(): void {
    const sub = this.getSubscription();
    sub.isPro = false;
    sub.proExpiresAt = undefined;
    this.saveSubscription(sub);
  }

  // Начислить бонусные запросы
  public addBonusRequests(count: number): void {
    const sub = this.getSubscription();
    sub.bonusRequests += count;
    this.saveSubscription(sub);
  }

  // Получить список выданных VIP
  public getGrantedVipList(): GrantedVipUser[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_GRANTED_VIPS);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // Выдать VIP другому пользователю по Telegram ID
  public grantVipToUser(userId: string, durationDays: number, name?: string): GrantedVipUser {
    const list = this.getGrantedVipList();
    const expiresAt = durationDays >= 9999 
      ? 'forever' 
      : new Date(Date.now() + durationDays * 86400000).toISOString();

    const newRecord: GrantedVipUser = {
      userId: userId.trim(),
      name: name || `Пользователь #${userId}`,
      grantedAt: new Date().toISOString(),
      expiresAt,
    };

    const filtered = list.filter(item => item.userId !== userId.trim());
    filtered.unshift(newRecord);
    localStorage.setItem(STORAGE_KEYS.ADMIN_GRANTED_VIPS, JSON.stringify(filtered));

    // Если этот ID совпадает с текущим клиентом, сразу включаем Pro
    const currentId = String(tg.getUser()?.id || '');
    if (currentId && currentId === userId.trim()) {
      this.grantProToSelf(durationDays);
    }

    return newRecord;
  }

  // Отозвать VIP у пользователя
  public revokeVipFromUser(userId: string): void {
    const list = this.getGrantedVipList();
    const filtered = list.filter(item => item.userId !== userId.trim());
    localStorage.setItem(STORAGE_KEYS.ADMIN_GRANTED_VIPS, JSON.stringify(filtered));
  }

  // Проверка VIP пользователя
  public isUserInVipList(userId: string): boolean {
    const list = this.getGrantedVipList();
    const found = list.find(item => item.userId === userId);
    if (!found) return false;

    if (found.expiresAt === 'forever') return true;
    return new Date(found.expiresAt).getTime() > Date.now();
  }

  // Создать промокод для передачи другу
  public createPromoCode(durationDays: number = 30): PromoCode {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `VIP-${durationDays >= 9999 ? 'FOREVER' : durationDays + 'D'}-${randomHex}`;

    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_PROMOCODES);
    const codes: PromoCode[] = raw ? JSON.parse(raw) : [];

    const newPromo: PromoCode = {
      code,
      durationDays,
      isUsed: false,
    };

    codes.unshift(newPromo);
    localStorage.setItem(STORAGE_KEYS.ADMIN_PROMOCODES, JSON.stringify(codes));
    return newPromo;
  }

  // Активировать промокод
  public activatePromoCode(codeStr: string): { success: boolean; message: string } {
    const clean = codeStr.trim().toUpperCase();
    
    // Специальный мастер-промокод разработчика
    if (clean === 'DEV777' || clean === 'DAYFLOW_ADMIN' || clean === 'YHUMIRA_VIP') {
      this.grantProToSelf(9999);
      return { success: true, message: '🎉 Активирован вечный статус Разработчика (SuperAdmin VIP)!' };
    }

    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_PROMOCODES);
    const codes: PromoCode[] = raw ? JSON.parse(raw) : [];

    const promo = codes.find(c => c.code === clean && !c.isUsed);
    if (!promo) {
      return { success: false, message: 'Неверный или уже использованный промокод' };
    }

    promo.isUsed = true;
    promo.usedBy = String(tg.getUser()?.id || 'client');
    localStorage.setItem(STORAGE_KEYS.ADMIN_PROMOCODES, JSON.stringify(codes));

    this.grantProToSelf(promo.durationDays);
    return { success: true, message: `🎉 Успешно активирован VIP на ${promo.durationDays >= 9999 ? 'весь срок' : promo.durationDays + ' дн.'}!` };
  }
}

export const starsPayment = new StarsPaymentService();
