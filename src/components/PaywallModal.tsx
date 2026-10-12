import React, { useState } from 'react';
import { X, Sparkles, Star, Zap, Check, ShieldCheck, Heart } from 'lucide-react';
import { STARS_TARIFFS, starsPayment } from '../services/starsPayment';
import { tg } from '../services/telegram';
import confetti from 'canvas-confetti';

interface PaywallModalProps {
  remainingRequests: number;
  onSuccess: () => void;
  onClose: () => void;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  remainingRequests,
  onSuccess,
  onClose,
}) => {
  const [selectedTariffId, setSelectedTariffId] = useState<string>('pro_monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successPaid, setSuccessPaid] = useState(false);

  const selectedTariff = STARS_TARIFFS.find(t => t.id === selectedTariffId) || STARS_TARIFFS[0];

  const handlePurchase = async () => {
    setIsProcessing(true);

    try {
      const res = await starsPayment.purchaseTariff(selectedTariffId);
      setIsProcessing(false);

      if (res.success) {
        setSuccessPaid(true);
        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#fbbf24', '#f59e0b', '#6366f1', '#ec4899'],
        });

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        tg.showAlert(res.error || 'Ошибка при оплате через Stars');
      }
    } catch (e: any) {
      setIsProcessing(false);
      tg.showAlert(e.message || 'Ошибка оплаты');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-sheet" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          maxHeight: '92vh',
          background: 'linear-gradient(180deg, #181d2f 0%, #0d121f 100%)',
          borderTop: '1px solid rgba(251, 191, 36, 0.4)',
        }}
      >
        {/* Кнопка закрытия */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Золотая шапка пейволла */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            width: 58, height: 58, borderRadius: 20,
            background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.45)',
          }}>
            <Star size={32} color="#111827" fill="#111827" />
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.3px', color: '#f8fafc' }}>
            DayFlow Voice Brain Pro
          </h2>
          <div style={{ fontSize: 13, color: '#fbbf24', fontWeight: 600, marginTop: 2 }}>
            Оплата через официальные Telegram Stars ⭐
          </div>
          {remainingRequests <= 0 && (
            <div style={{ fontSize: 11, color: 'var(--accent-rose)', marginTop: 4 }}>
              Ваш недельный лимит (5 бесплатных запросов) исчерпан
            </div>
          )}
        </div>

        {/* Преимущества подписки */}
        <div className="glass-card" style={{ padding: '12px 14px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={14} color="#fbbf24" />
            </div>
            <div style={{ fontSize: 12.5, color: '#e2e8f0' }}>
              <strong>Безлимитный голосовой ввод</strong> потока мыслей
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={14} color="var(--primary)" />
            </div>
            <div style={{ fontSize: 12.5, color: '#e2e8f0' }}>
              <strong>Умный AI-разбор</strong> пар, задач и дней рождения за 2 сек
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={14} color="var(--accent-green)" />
            </div>
            <div style={{ fontSize: 12.5, color: '#e2e8f0' }}>
              <strong>Приоритетный утренний баланс</strong> дня без стресса
            </div>
          </div>
        </div>

        {/* Выбор тарифа */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
          {STARS_TARIFFS.map(tariff => {
            const isSelected = selectedTariffId === tariff.id;
            return (
              <div
                key={tariff.id}
                onClick={() => {
                  tg.haptic('selection');
                  setSelectedTariffId(tariff.id);
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: 14,
                  background: isSelected ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(26, 35, 54, 0.8) 100%)' : 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid',
                  borderColor: isSelected ? '#fbbf24' : 'var(--border-subtle)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? '0 0 15px rgba(245, 158, 11, 0.2)' : 'none',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
                      {tariff.title}
                    </span>
                    {tariff.badge && (
                      <span style={{ 
                        fontSize: 10, padding: '2px 6px', borderRadius: 6, 
                        background: '#fbbf24', color: '#111827', fontWeight: 800 
                      }}>
                        {tariff.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, maxWidth: 220 }}>
                    {tariff.description}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>{tariff.starsAmount}</span>
                    <Star size={16} fill="#fbbf24" color="#fbbf24" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Кнопка оплаты */}
        <button
          onClick={handlePurchase}
          disabled={isProcessing || successPaid}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 15,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.4)',
          }}
        >
          {successPaid ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Check size={18} />
              <span>Оплачено успешно! PRO активирован ⭐</span>
            </span>
          ) : isProcessing ? (
            <span>Подключение к Telegram Stars...</span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Оплатить {selectedTariff.starsAmount}</span>
              <Star size={16} fill="#fff" color="#fff" />
              <span>в Telegram</span>
            </span>
          )}
        </button>

      </div>
    </div>
  );
};
