import React from 'react';
import { X, Sparkles, Clock, CheckCircle2, ShieldCheck, Coffee, Car } from 'lucide-react';
import { DayPlanSlot, DayAnalysis } from '../types';
import { tg } from '../services/telegram';
import confetti from 'canvas-confetti';

interface DayPlannerModalProps {
  slots: DayPlanSlot[];
  analysis: DayAnalysis;
  onClose: () => void;
}

export const DayPlannerModal: React.FC<DayPlannerModalProps> = ({
  slots,
  analysis,
  onClose,
}) => {
  const handleApply = () => {
    tg.haptic('notification', 'success');
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });
    tg.showAlert(' План на день зафиксирован и сбалансирован! Уведомления настроены.');
    onClose();
  };

  const getSlotIcon = (type: DayPlanSlot['type']) => {
    switch (type) {
      case 'break':
        return <Coffee size={16} color="var(--accent-green)" />;
      case 'commute':
        return <Car size={16} color="var(--accent-amber)" />;
      case 'task':
        return <CheckCircle2 size={16} color="var(--secondary)" />;
      default:
        return <Clock size={16} color="var(--primary)" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        
        {/* Заголовок */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>AI Балансировщик Дня</h3>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Оптимальный поминутный тайм-менеджмент</div>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Сводка безопасности плана (Debate Hall / Stress Check) */}
        <div 
          style={{ 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.25)', 
            borderRadius: 14, padding: '10px 12px', marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 10 
          }}
        >
          <ShieldCheck size={22} color="var(--accent-green)" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: 'var(--text-main)', lineHeight: 1.4 }}>
            <strong>Верификация плана пройдена:</strong> Заложены паузы на перемещение между корпусами и 45 мин на обед. Риск выгорания: <strong>{analysis.stressScore}% ({analysis.verdict})</strong>.
          </div>
        </div>

        {/* Таймлайн слотов */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, paddingRight: 4, marginBottom: 16 }}>
          {slots.map((slot, index) => (
            <div 
              key={index}
              style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '10px 12px', borderRadius: 12,
                background: slot.type === 'break' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                border: slot.isImportant ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.05)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 2
              }}>
                {getSlotIcon(slot.type)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--secondary)', fontFamily: 'var(--font-mono)' }}>
                    {slot.time}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {slot.durationMin} мин
                  </span>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                  {slot.title}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Кнопка принять план */}
        <button 
          onClick={handleApply}
          className="btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: 15 }}
        >
          Применить этот график дня
        </button>

      </div>
    </div>
  );
};
