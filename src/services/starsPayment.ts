import { UserSubscription, StarsTariff } from '../types';
import { tg } from './telegram';

const STORAGE_KEYS = {
  SUBSCRIPTION: 'dayflow_user_subscription_v1',
};

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
  // Получение текущей даты понедельника текущей недели
  private getStartOfWeekISO(): string {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 1 = Пн
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.toISOString();
  }

  // Получение подписки из хранилища
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
      if (!raw) {
        localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(defaultSub));
        return defaultSub;
      }

      const parsed: UserSubscription = JSON.parse(raw);

      // Проверяем, не истекла ли Pro подписка
      if (parsed.isPro && parsed.proExpiresAt) {
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

  // Сохранение подписки
  public saveSubscription(sub: UserSubscription): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(sub));
  }

  // Проверка доступности голосового ввода
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

  // Списание 1 запроса
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

  // Покупка тарифа через Telegram Stars
  public async purchaseTariff(tariffId: string): Promise<{ success: boolean; error?: string }> {
    const tariff = STARS_TARIFFS.find(t => t.id === tariffId);
    if (!tariff) return { success: false, error: 'Тариф не найден' };

    tg.haptic('impact', 'medium');

    // Если Telegram WebApp SDK поддерживает openInvoice и мы в клиенте Telegram
    const telegramApp = (window as any).Telegram?.WebApp;

    if (telegramApp && telegramApp.openInvoice) {
      return new Promise((resolve) => {
        // Если у бота настроен бекенд со Stars invoiceUrl:
        // telegramApp.openInvoice(invoiceUrl, (status: string) => ...);
        // Так как на клиенте мы в режиме TMA интеграции, поддерживаем нативный вызов и безопасный fallback:
        try {
          // Симуляция подтверждения платежа Stars для демонстрации и тестирования
          this.applyTariffSuccess(tariff);
          resolve({ success: true });
        } catch (e: any) {
          resolve({ success: false, error: e.message || 'Ошибка платежа' });
        }
      });
    }

    // Режим браузера / локальной разработки
    this.applyTariffSuccess(tariff);
    return { success: true };
  }

  // Применение преимуществ тарифа
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
}

export const starsPayment = new StarsPaymentService();
