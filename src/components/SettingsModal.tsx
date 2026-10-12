import React, { useState } from 'react';
import { 
  X, Bell, Send, CheckCircle2, AlertCircle, 
  Clock, Shield, Trash2, Smartphone, Key, User, Crown 
} from 'lucide-react';
import { NotificationSettings } from '../types';
import { notificationService } from '../services/notificationService';
import { starsPayment } from '../services/starsPayment';
import { tg } from '../services/telegram';
import confetti from 'canvas-confetti';

interface SettingsModalProps {
  settings: NotificationSettings;
  onSaveSettings: (settings: NotificationSettings) => void;
  onClearAll: () => void;
  onOpenAdmin: () => void;
  onRefreshSubscription?: () => void;
  onBackup?: () => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings: initialSettings,
  onSaveSettings,
  onClearAll,
  onOpenAdmin,
  onRefreshSubscription,
  onBackup,
  onClose,
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(initialSettings);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testError, setTestError] = useState('');
  const [backupStatus, setBackupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Состояние промокода
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Сессия администратора (скрыта от обычных пользователей)
  const [isAdminSession, setIsAdminSession] = useState<boolean>(() => {
    return localStorage.getItem('dayflow_admin_auth_session') === 'true';
  });

  // Секретный триггер входа для создателя (5 тапов по версии)
  const [versionTaps, setVersionTaps] = useState(0);
  const handleVersionTap = () => {
    const next = versionTaps + 1;
    setVersionTaps(next);
    tg.haptic('selection');
    if (next >= 5) {
      setVersionTaps(0);
      tg.haptic('notification', 'success');
      onOpenAdmin();
      onClose();
    }
  };

  const handleActivatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    tg.haptic('impact', 'medium');
    const res = starsPayment.activatePromoCode(promoInput);
    setPromoMessage({ text: res.message, success: res.success });

    if (res.success) {
      confetti({ particleCount: 50, spread: 60 });
      onRefreshSubscription?.();
      setPromoInput('');
    }
  };

  const handleToggleNotify = () => {
    tg.haptic('selection');
    setSettings(prev => ({ ...prev, enableTelegramNotify: !prev.enableTelegramNotify }));
  };

  const handleTestNotification = async () => {
    if (!settings.chatId) {
      setTestStatus('error');
      setTestError('Укажите ваш Chat ID (или откройте приложение внутри Telegram)');
      return;
    }

    tg.haptic('impact', 'medium');
    setTestStatus('loading');
    setTestError('');

    const res = await notificationService.sendTestMessage(settings);
    if (res.success) {
      tg.haptic('notification', 'success');
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 4000);
    } else {
      tg.haptic('notification', 'error');
      setTestStatus('error');
      setTestError(res.error || 'Ошибка отправки');
    }
  };

  const handleSave = () => {
    tg.haptic('notification', 'success');
    onSaveSettings(settings);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '92vh' }}>
        
        {/* Шапка модалки */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Bell size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Настройки уведомлений</h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Telegram-бот @DayFlowHelper_bot</div>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, paddingRight: 2 }}>
          
          {/* Главный переключатель уведомлений */}
          <div 
            className="glass-card" 
            style={{ 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: settings.enableTelegramNotify ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(26, 35, 54, 0.8) 100%)' : 'var(--bg-card)'
            }}
          >
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Отправка в Telegram</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>
                Присылать напоминания о парах и делах в личку
              </div>
            </div>

            <button
              onClick={handleToggleNotify}
              style={{
                width: 50, height: 28, borderRadius: 14,
                background: settings.enableTelegramNotify ? 'var(--primary)' : 'rgba(255, 255, 255, 0.15)',
                border: 'none', cursor: 'pointer', position: 'relative',
                transition: 'background 0.25s',
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3,
                left: settings.enableTelegramNotify ? 25 : 3,
                transition: 'left 0.25s',
              }} />
            </button>
          </div>

          {/* Настройки упреждения (за сколько напоминать) */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={16} color="var(--primary)" />
              <span>За сколько времени напоминать</span>
            </div>

            {/* Пары и встречи */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                🎓 До начала пары или встречи:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[10, 15, 30, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      tg.haptic('selection');
                      setSettings(prev => ({ ...prev, classRemindMinutes: mins }));
                    }}
                    style={{
                      padding: '8px 0', borderRadius: 10,
                      border: '1px solid',
                      borderColor: settings.classRemindMinutes === mins ? 'var(--primary)' : 'var(--border-subtle)',
                      background: settings.classRemindMinutes === mins ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.03)',
                      color: settings.classRemindMinutes === mins ? '#fff' : 'var(--text-muted)',
                      fontWeight: settings.classRemindMinutes === mins ? 700 : 500,
                      fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    {mins} мин
                  </button>
                ))}
              </div>
            </div>

            {/* Задачи и дедлайны */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                📌 До дедлайна задачи:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[15, 30, 45, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      tg.haptic('selection');
                      setSettings(prev => ({ ...prev, taskRemindMinutes: mins }));
                    }}
                    style={{
                      padding: '8px 0', borderRadius: 10,
                      border: '1px solid',
                      borderColor: settings.taskRemindMinutes === mins ? 'var(--secondary)' : 'var(--border-subtle)',
                      background: settings.taskRemindMinutes === mins ? 'var(--secondary-glow)' : 'rgba(255, 255, 255, 0.03)',
                      color: settings.taskRemindMinutes === mins ? '#fff' : 'var(--text-muted)',
                      fontWeight: settings.taskRemindMinutes === mins ? 700 : 500,
                      fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    {mins} мин
                  </button>
                ))}
              </div>
            </div>

            {/* Дни рождения */}
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                🎂 До дня рождения:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {[
                  { days: 0, label: 'В тот же день' },
                  { days: 1, label: 'За 1 день' },
                  { days: 3, label: 'За 3 дня' },
                  { days: 7, label: 'За неделю' },
                ].map(opt => (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => {
                      tg.haptic('selection');
                      setSettings(prev => ({ ...prev, birthdayRemindDays: opt.days }));
                    }}
                    style={{
                      padding: '8px 4px', borderRadius: 10,
                      border: '1px solid',
                      borderColor: settings.birthdayRemindDays === opt.days ? 'var(--accent-rose)' : 'var(--border-subtle)',
                      background: settings.birthdayRemindDays === opt.days ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: settings.birthdayRemindDays === opt.days ? '#fff' : 'var(--text-muted)',
                      fontWeight: settings.birthdayRemindDays === opt.days ? 700 : 500,
                      fontSize: 11, cursor: 'pointer',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Параметры подключения к Telegram */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Smartphone size={16} color="var(--accent-green)" />
              <span>Параметры Telegram бота</span>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 3 }}>
                Твой Chat ID / Telegram ID
              </label>
              <input 
                type="text" 
                className="input-glass"
                placeholder="напр. 123456789"
                value={settings.chatId}
                onChange={e => setSettings(prev => ({ ...prev, chatId: e.target.value.trim() }))}
                style={{ fontSize: 13, padding: '8px 12px' }}
              />
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
                💡 Нажмите <b>/start</b> в боте <a href="https://t.me/DayFlowHelper_bot" target="_blank" rel="noreferrer" style={{ color: 'var(--secondary)' }}>@DayFlowHelper_bot</a>, чтобы бот имел право писать вам в личные сообщения.
              </div>
            </div>

            {/* Кнопка отправки теста */}
            <button
              onClick={handleTestNotification}
              disabled={testStatus === 'loading'}
              className="btn-ghost"
              style={{
                width: '100%', justifyContent: 'center', marginTop: 4,
                borderColor: testStatus === 'success' ? 'var(--accent-green)' : 'var(--border-subtle)',
                color: testStatus === 'success' ? 'var(--accent-green)' : 'var(--text-main)',
              }}
            >
              {testStatus === 'loading' ? (
                <span>Отправка...</span>
              ) : testStatus === 'success' ? (
                <>
                  <CheckCircle2 size={16} color="var(--accent-green)" />
                  <span>Уведомление доставлено в Telegram! 🎉</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Отправить тестовое напоминание в бот</span>
                </>
              )}
            </button>

            {/* Кнопка резервной копии в бот */}
            {onBackup && (
              <button
                onClick={async () => {
                  tg.haptic('selection');
                  setBackupStatus('loading');
                  try {
                    const res = await onBackup();
                    if (res?.success) {
                      setBackupStatus('success');
                      tg.haptic('notification', 'success');
                      setTimeout(() => setBackupStatus('idle'), 3500);
                    } else {
                      setBackupStatus('error');
                      tg.showAlert(res?.error || 'Ошибка создания резервной копии');
                    }
                  } catch (e: any) {
                    setBackupStatus('error');
                    tg.showAlert(e.message || 'Ошибка');
                  }
                }}
                disabled={backupStatus === 'loading'}
                className="btn-ghost"
                style={{
                  width: '100%', justifyContent: 'center', marginTop: 4,
                  borderColor: backupStatus === 'success' ? 'var(--accent-green)' : 'var(--border-subtle)',
                  color: backupStatus === 'success' ? 'var(--accent-green)' : 'var(--text-muted)',
                  fontSize: 12, padding: '8px 12px'
                }}
              >
                {backupStatus === 'loading' ? (
                  <span>Сохранение копии...</span>
                ) : backupStatus === 'success' ? (
                  <>
                    <CheckCircle2 size={15} color="var(--accent-green)" />
                    <span>Резервная копия отправлена в бот! 💾</span>
                  </>
                ) : (
                  <span>💾 Отправить резервную копию в бот</span>
                )}
              </button>
            )}

            {testError && (
              <div style={{ fontSize: 12, color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} />
                <span>{testError}</span>
              </div>
            )}
          </div>

          {/* Секция: Активация промокода */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Key size={14} color="#fbbf24" />
              <span>Промокод на VIP доступ</span>
            </div>

            <form onSubmit={handleActivatePromo} style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text" 
                className="input-glass"
                placeholder="FLOW-VIP-XXXX-..."
                value={promoInput}
                onChange={e => setPromoInput(e.target.value)}
                style={{ fontSize: 13, padding: '8px 12px', flex: 1 }}
              />
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}
              >
                Применить
              </button>
            </form>

            {promoMessage && (
              <div style={{ fontSize: 12, color: promoMessage.success ? 'var(--accent-green)' : 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: 6 }}>
                {promoMessage.success ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                <span>{promoMessage.text}</span>
              </div>
            )}
          </div>

          {/* Панель разработчика (Отображается ТОЛЬКО если активна сессия админа) */}
          {isAdminSession && (
            <div 
              className="glass-card" 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderColor: 'rgba(251, 191, 36, 0.4)', background: 'rgba(251, 191, 36, 0.08)',
                padding: '10px 14px' 
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Crown size={16} color="#fbbf24" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fbbf24' }}>Админ-панель</span>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    tg.haptic('selection');
                    onOpenAdmin();
                    onClose();
                  }}
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '5px 10px', borderColor: '#fbbf24', color: '#fbbf24' }}
                >
                  Открыть
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('dayflow_admin_auth_session');
                    setIsAdminSession(false);
                    tg.haptic('impact', 'light');
                  }}
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '5px 8px', color: 'var(--text-dim)' }}
                >
                  Выйти
                </button>
              </div>
            </div>
          )}

          {/* Очистить все данные */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
            <button
              onClick={() => {
                if (window.confirm('Очистить все задачи, расписание и начать с чистого листа?')) {
                  tg.haptic('notification', 'warning');
                  onClearAll();
                  onClose();
                }
              }}
              style={{
                background: 'transparent', border: 'none', color: 'var(--accent-rose)',
                fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, opacity: 0.75
              }}
            >
              <Trash2 size={14} />
              <span>Очистить все данные органайзера</span>
            </button>
          </div>

        </div>

        {/* Кнопка сохранения */}
        <button 
          onClick={handleSave}
          className="btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: 14, marginTop: 14 }}
        >
          Сохранить настройки
        </button>

        {/* Скрытый триггер для создателя: 5 тапов по версии открывают защищенную админку */}
        <div 
          onClick={handleVersionTap}
          style={{ 
            textAlign: 'center', fontSize: 11, color: 'var(--text-dim)', 
            marginTop: 12, cursor: 'pointer', userSelect: 'none', padding: '4px' 
          }}
        >
          DayFlow v1.2 • Умный органайзер
        </div>

      </div>
    </div>
  );
};
