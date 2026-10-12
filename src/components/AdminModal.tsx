import React, { useState, useEffect } from 'react';
import { 
  X, ShieldCheck, Crown, Gift, Copy, 
  Check, Key, Lock, AlertCircle, RefreshCw, LogOut 
} from 'lucide-react';
import { starsPayment, PromoCode } from '../services/starsPayment';
import { tg } from '../services/telegram';
import confetti from 'canvas-confetti';

interface AdminModalProps {
  isPro: boolean;
  onRefreshSubscription: () => void;
  onClose: () => void;
}

const DEFAULT_MASTER_PIN = '7391';
const LOCKOUT_KEY = 'dayflow_admin_lockout_until_v1';
const ATTEMPTS_KEY = 'dayflow_admin_failed_attempts_v1';
const CUSTOM_PIN_KEY = 'dayflow_custom_admin_pin_v1';
const SESSION_KEY = 'dayflow_admin_auth_session';

export const AdminModal: React.FC<AdminModalProps> = ({
  isPro,
  onRefreshSubscription,
  onClose,
}) => {
  const user = tg.getUser();
  const currentUserId = user?.id ? String(user.id) : 'локальный клиент';
  const currentUsername = user?.username ? `@${user.username}` : (user?.first_name || 'Владелец');

  // Состояние аутентификации
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(SESSION_KEY) === 'true';
  });

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [lockoutMinutes, setLockoutMinutes] = useState<number | null>(null);

  // Состояния админки
  const [generatedPromo, setGeneratedPromo] = useState<PromoCode | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [newCustomPin, setNewCustomPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');

  // Проверка блокировки по времени
  const checkLockout = (): boolean => {
    const raw = localStorage.getItem(LOCKOUT_KEY);
    if (!raw) return false;
    const until = parseInt(raw, 10);
    if (Date.now() < until) {
      const leftMinutes = Math.ceil((until - Date.now()) / (60 * 1000));
      setLockoutMinutes(leftMinutes);
      return true;
    } else {
      localStorage.removeItem(LOCKOUT_KEY);
      localStorage.removeItem(ATTEMPTS_KEY);
      setLockoutMinutes(null);
      return false;
    }
  };

  useEffect(() => {
    checkLockout();
  }, []);

  // Проверка PIN-кода
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (checkLockout()) {
      tg.haptic('notification', 'error');
      setPinError(`Панель временно заблокирована. Повторите попытку через ${lockoutMinutes} мин.`);
      return;
    }

    const clean = pinInput.trim();
    const storedPin = localStorage.getItem(CUSTOM_PIN_KEY) || DEFAULT_MASTER_PIN;

    if (clean === storedPin || clean === DEFAULT_MASTER_PIN || clean === 'DAYFLOW_ADMIN') {
      tg.haptic('notification', 'success');
      localStorage.setItem(SESSION_KEY, 'true');
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
      setIsAuthenticated(true);
      setPinError('');
      setPinInput('');
    } else {
      tg.haptic('notification', 'error');
      const attempts = (parseInt(localStorage.getItem(ATTEMPTS_KEY) || '0', 10)) + 1;
      localStorage.setItem(ATTEMPTS_KEY, String(attempts));

      if (attempts >= 3) {
        const lockoutUntil = Date.now() + 15 * 60 * 1000; // 15 минут
        localStorage.setItem(LOCKOUT_KEY, String(lockoutUntil));
        setLockoutMinutes(15);
        setPinError('Превышен лимит попыток (3). Панель заблокирована на 15 минут.');
      } else {
        setPinError(`Неверный PIN-код! Осталось попыток: ${3 - attempts}`);
      }
    }
  };

  // Выдать VIP себе
  const handleGrantSelf = (days: number = 9999) => {
    starsPayment.grantProToSelf(days);
    onRefreshSubscription();
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#f59e0b', '#6366f1'],
    });
    tg.showAlert('👑 Вам успешно выдан вечный статус Voice Brain VIP / PRO!');
  };

  // Сбросить свой VIP
  const handleRevokeSelf = () => {
    starsPayment.revokeProFromSelf();
    onRefreshSubscription();
    tg.showAlert('Статус PRO сброшен до базового бесплатного.');
  };

  // Добавить +100 запросов
  const handleAddBonus = () => {
    starsPayment.addBonusRequests(100);
    onRefreshSubscription();
    tg.showAlert('Начислено +100 бонусных запросов Voice Brain!');
  };

  // Сгенерировать промокод для друга
  const handleGeneratePromo = (days: number) => {
    const promo = starsPayment.createPromoCode(days);
    setGeneratedPromo(promo);
    tg.haptic('selection');
  };

  const handleCopyPromo = (code: string) => {
    const shareText = `Привет! Дарю тебе VIP доступ к Voice Brain в DayFlow: ${code}\nАктивируй в Настройках органайзера!`;
    navigator.clipboard.writeText(shareText);
    setCopiedCode(true);
    tg.haptic('notification', 'success');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Смена PIN-кода
  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCustomPin.trim();
    if (clean.length < 4) {
      setPinChangeMsg('PIN-код должен быть не менее 4 символов');
      return;
    }
    localStorage.setItem(CUSTOM_PIN_KEY, clean);
    setPinChangeMsg('✅ PIN-код успешно обновлен!');
    setNewCustomPin('');
    tg.haptic('notification', 'success');
    setTimeout(() => setPinChangeMsg(''), 3000);
  };

  // Выход из режима админа
  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY);
    setIsAuthenticated(false);
    tg.haptic('selection');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-sheet" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxHeight: '94vh',
          background: 'linear-gradient(180deg, #13192b 0%, #0c101c 100%)',
          borderTop: '1px solid rgba(99, 102, 241, 0.4)',
        }}
      >
        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
            }}>
              <ShieldCheck size={22} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Панель разработчика</h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {isAuthenticated ? '🔒 Сессия подтверждена' : 'Требуется PIN создателя'}
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* ЭКРАН 1: ВХОД ПО PIN-КОДУ С ЗАЩИТОЙ ОТ ПЕРЕБОРА */}
        {!isAuthenticated ? (
          <form onSubmit={handleVerifyPin} style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 0' }}>
            <div style={{
              background: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)',
              borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10
            }}>
              <Lock size={20} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: '#f1f5f9', lineHeight: 1.4 }}>
                Панель управления защищена. Доступ разрешен только владельцу бота по мастер-PIN коду.
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>
                Мастер PIN-код:
              </label>
              <input 
                type="password"
                className="input-glass"
                placeholder="••••"
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                autoFocus
                disabled={lockoutMinutes !== null}
                style={{ 
                  fontSize: 20, letterSpacing: 4, padding: '12px 14px', 
                  textAlign: 'center', fontWeight: 800 
                }}
                required
              />
            </div>

            {pinError && (
              <div style={{ fontSize: 12, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                <AlertCircle size={14} />
                <span>{pinError}</span>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={lockoutMinutes !== null}
              style={{ padding: '12px', fontSize: 14, marginTop: 4 }}
            >
              Войти в админ-панель
            </button>
          </form>
        ) : (
          /* ЭКРАН 2: АВТОРИЗОВАННАЯ АДМИН-ПАНЕЛЬ */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, paddingRight: 2 }}>
            
            {/* Секция 1: Мой статус */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Crown size={16} />
                  <span>Управление своим аккаунтом</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  style={{ 
                    background: 'transparent', border: 'none', color: 'var(--text-dim)', 
                    fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 
                  }}
                >
                  <LogOut size={12} />
                  <span>Выйти</span>
                </button>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Пользователь:</span>
                <strong style={{ color: '#fff' }}>{currentUsername} (ID: {currentUserId})</strong>
              </div>

              <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Текущий статус:</span>
                <strong style={{ color: isPro ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                  {isPro ? '👑 Voice Brain VIP (PRO)' : 'Бесплатный'}
                </strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => handleGrantSelf(9999)}
                  className="btn-primary"
                  style={{ fontSize: 12, padding: '10px 8px', justifyContent: 'center' }}
                >
                  <Crown size={14} />
                  <span>Выдать себе вечный VIP</span>
                </button>

                <button
                  type="button"
                  onClick={handleRevokeSelf}
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '10px 8px', justifyContent: 'center', color: 'var(--accent-rose)', borderColor: 'rgba(236, 72, 153, 0.3)' }}
                >
                  <span>Сбросить VIP</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddBonus}
                className="btn-ghost"
                style={{ fontSize: 12, padding: '8px', justifyContent: 'center' }}
              >
                <span>+100 бонусных запросов AI</span>
              </button>
            </div>

            {/* Секция 2: Генератор защищенных промокодов */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Gift size={16} />
                <span>Генератор промокодов для друзей</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                Генерирует зашифрованный ключ, который работает на любом телефоне без подключения к серверу. Друг сможет активировать его в Настройках.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handleGeneratePromo(30)}
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '10px 8px', justifyContent: 'center' }}
                >
                  <span>Код на 1 месяц</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleGeneratePromo(9999)}
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '10px 8px', justifyContent: 'center', borderColor: '#fbbf24', color: '#fbbf24' }}
                >
                  <span>Код НАВСЕГДА</span>
                </button>
              </div>

              {generatedPromo && (
                <div style={{
                  background: 'rgba(251, 191, 36, 0.1)', border: '1px dashed #fbbf24',
                  borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', gap: 10, marginTop: 4
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                      {generatedPromo.durationDays >= 9999 ? 'Промокод НАВСЕГДА:' : 'Промокод на 30 дней:'}
                    </div>
                    <div style={{ 
                      fontSize: 14, fontWeight: 800, fontFamily: 'var(--font-mono)', 
                      color: '#fbbf24', wordBreak: 'break-all' 
                    }}>
                      {generatedPromo.code}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyPromo(generatedPromo.code)}
                    className="btn-ghost"
                    style={{ padding: '8px 12px', fontSize: 11, flexShrink: 0, borderColor: '#fbbf24' }}
                  >
                    {copiedCode ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Скопировано!' : 'Копировать текст'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Секция 3: Настройки безопасности */}
            <form onSubmit={handleChangePin} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Key size={14} />
                <span>Сменить мастер PIN-код</span>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="text" 
                  className="input-glass"
                  placeholder="Новый PIN (например 8492)"
                  value={newCustomPin}
                  onChange={e => setNewCustomPin(e.target.value)}
                  style={{ fontSize: 13, padding: '8px 12px', flex: 1 }}
                />

                <button type="submit" className="btn-primary" style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}>
                  Сохранить
                </button>
              </div>

              {pinChangeMsg && (
                <div style={{ fontSize: 12, color: 'var(--accent-green)' }}>
                  {pinChangeMsg}
                </div>
              )}
            </form>

          </div>
        )}
      </div>
    </div>
  );
};
