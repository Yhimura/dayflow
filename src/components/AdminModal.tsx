import React, { useState } from 'react';
import { 
  X, ShieldCheck, Crown, UserPlus, Gift, Copy, 
  Check, Trash2, Key, Star, Sparkles, RefreshCw 
} from 'lucide-react';
import { starsPayment, GrantedVipUser, PromoCode } from '../services/starsPayment';
import { tg } from '../services/telegram';
import confetti from 'canvas-confetti';

interface AdminModalProps {
  isPro: boolean;
  onRefreshSubscription: () => void;
  onClose: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isPro,
  onRefreshSubscription,
  onClose,
}) => {
  const user = tg.getUser();
  const currentUserId = user?.id ? String(user.id) : 'локальный клиент';

  // Состояния
  const [targetUserId, setTargetUserId] = useState('');
  const [targetName, setTargetName] = useState('');
  const [targetDays, setTargetDays] = useState<number>(9999);
  const [vipList, setVipList] = useState<GrantedVipUser[]>(starsPayment.getGrantedVipList());
  const [generatedPromo, setGeneratedPromo] = useState<PromoCode | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; success: boolean } | null>(null);

  // Выдать VIP себе
  const handleGrantSelf = (days: number = 9999) => {
    starsPayment.grantProToSelf(days);
    onRefreshSubscription();
    confetti({
      particleCount: 50,
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
    tg.showAlert(' Начислено +100 бонусных запросов Voice Brain!');
  };

  // Выдать VIP другому пользователю
  const handleGrantOther = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserId.trim()) return;

    tg.haptic('notification', 'success');
    const record = starsPayment.grantVipToUser(targetUserId, targetDays, targetName);
    setVipList(starsPayment.getGrantedVipList());
    setTargetUserId('');
    setTargetName('');

    confetti({ particleCount: 30, spread: 50 });
    tg.showAlert(`✅ VIP статус успешно выдан пользователю ${record.name} (ID: ${record.userId})!`);
  };

  // Отозвать VIP
  const handleRevokeOther = (userId: string) => {
    starsPayment.revokeVipFromUser(userId);
    setVipList(starsPayment.getGrantedVipList());
    tg.haptic('impact', 'medium');
  };

  // Сгенерировать промокод
  const handleGeneratePromo = (days: number) => {
    const promo = starsPayment.createPromoCode(days);
    setGeneratedPromo(promo);
    tg.haptic('selection');
  };

  const handleCopyPromo = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    tg.haptic('notification', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Активация промокода
  const handleActivatePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    const res = starsPayment.activatePromoCode(promoInput);
    setPromoMessage({ text: res.message, success: res.success });
    if (res.success) {
      onRefreshSubscription();
      confetti({ particleCount: 50, spread: 60 });
      setPromoInput('');
    }
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
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Админ-панель (Dev VIP)</h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Управление доступом и выдача подписок
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1, paddingRight: 2 }}>
          
          {/* Секция 1: Мой аккаунт */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Crown size={16} />
              <span>Управление своим аккаунтом</span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Ваш Telegram ID:</span>
              <strong style={{ color: '#fff' }}>{currentUserId}</strong>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Текущий статус:</span>
              <strong style={{ color: isPro ? '#fbbf24' : 'var(--text-dim)' }}>
                {isPro ? '👑 PRO / VIP (Безлимит)' : 'Базовый Free'}
              </strong>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => handleGrantSelf(9999)}
                className="btn-primary"
                style={{ padding: '9px 12px', fontSize: 12, borderRadius: 10 }}
              >
                <Crown size={14} />
                <span>Дать себе VIP Навсегда</span>
              </button>

              <button
                onClick={handleAddBonus}
                className="btn-ghost"
                style={{ padding: '9px 12px', fontSize: 12, borderRadius: 10, justifyContent: 'center' }}
              >
                <Sparkles size={14} color="#fbbf24" />
                <span>+100 запросов</span>
              </button>
            </div>

            {isPro && (
              <button
                onClick={handleRevokeSelf}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text-dim)',
                  fontSize: 11, cursor: 'pointer', textAlign: 'center', marginTop: 4
                }}
              >
                Сбросить Pro (для проверки базового режима)
              </button>
            )}
          </div>

          {/* Секция 2: Выдать VIP другому пользователю */}
          <form onSubmit={handleGrantOther} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserPlus size={16} color="var(--primary)" />
              <span>Выдать VIP другому человеку</span>
            </div>

            <div>
              <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                Telegram ID получателя
              </label>
              <input 
                type="text" 
                className="input-glass"
                placeholder="напр. 123456789"
                value={targetUserId}
                onChange={e => setTargetUserId(e.target.value)}
                style={{ fontSize: 13, padding: '8px 12px' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                  Имя / заметка
                </label>
                <input 
                  type="text" 
                  className="input-glass"
                  placeholder="напр. Друг Саша"
                  value={targetName}
                  onChange={e => setTargetName(e.target.value)}
                  style={{ fontSize: 13, padding: '8px 12px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>
                  Срок действия
                </label>
                <select
                  className="input-glass"
                  value={targetDays}
                  onChange={e => setTargetDays(Number(e.target.value))}
                  style={{ background: '#172033', fontSize: 12, padding: '8px' }}
                >
                  <option value={30}>1 месяц (30 дней)</option>
                  <option value={365}>1 год (365 дней)</option>
                  <option value={9999}>Навсегда (Forever)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ padding: '10px', fontSize: 13, marginTop: 4 }}>
              <UserPlus size={15} />
              <span>Выдать VIP доступ</span>
            </button>
          </form>

          {/* Список выданных VIP */}
          {vipList.length > 0 && (
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>
                Выданные доступы ({vipList.length}):
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                {vipList.map(item => (
                  <div 
                    key={item.userId}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 10px', borderRadius: 8, background: 'rgba(255, 255, 255, 0.03)',
                      fontSize: 12
                    }}
                  >
                    <div>
                      <strong>{item.name || item.userId}</strong>
                      <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                        ID: {item.userId} • {item.expiresAt === 'forever' ? 'Навсегда' : 'До ' + item.expiresAt.split('T')[0]}
                      </div>
                    </div>

                    <button
                      onClick={() => handleRevokeOther(item.userId)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', padding: 4 }}
                      title="Отозвать VIP"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Секция 3: Генератор промокодов */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Gift size={16} />
              <span>Генератор VIP Промокодов для друзей</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleGeneratePromo(30)}
                className="btn-ghost"
                style={{ fontSize: 12, padding: '8px', justifyContent: 'center' }}
              >
                <span>Код на 1 месяц</span>
              </button>

              <button
                type="button"
                onClick={() => handleGeneratePromo(9999)}
                className="btn-ghost"
                style={{ fontSize: 12, padding: '8px', justifyContent: 'center', borderColor: '#fbbf24', color: '#fbbf24' }}
              >
                <span>Код НАВСЕГДА</span>
              </button>
            </div>

            {generatedPromo && (
              <div style={{
                background: 'rgba(251, 191, 36, 0.1)', border: '1px dashed #fbbf24',
                borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', marginTop: 4
              }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>Скопируйте и отправьте другу:</div>
                  <div style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>
                    {generatedPromo.code}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyPromo(generatedPromo.code)}
                  className="btn-ghost"
                  style={{ padding: '6px 10px', fontSize: 11 }}
                >
                  {copiedCode ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                  <span>{copiedCode ? 'Скопировано!' : 'Копировать'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Секция 4: Активация промокода */}
          <form onSubmit={handleActivatePromo} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Key size={14} />
              <span>Активировать промокод (или секретный код DEV777)</span>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input 
                type="text" 
                className="input-glass"
                placeholder="VIP-FOREVER-... или DEV777"
                value={promoInput}
                onChange={e => setPromoInput(e.target.value)}
                style={{ fontSize: 13, padding: '8px 12px' }}
              />

              <button type="submit" className="btn-primary" style={{ padding: '8px 14px', fontSize: 12, flexShrink: 0 }}>
                Применить
              </button>
            </div>

            {promoMessage && (
              <div style={{ fontSize: 12, color: promoMessage.success ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                {promoMessage.text}
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
};
