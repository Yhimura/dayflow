import React from 'react';
import { Mic, Star } from 'lucide-react';
import { tg } from '../services/telegram';

interface VoiceFloatingButtonProps {
  isPro: boolean;
  remainingRequests: number;
  onClick: () => void;
}

export const VoiceFloatingButton: React.FC<VoiceFloatingButtonProps> = ({
  isPro,
  remainingRequests,
  onClick,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 84, // над нижним таббаром
        right: 18,
        zIndex: 90,
      }}
    >
      <button
        onClick={() => {
          tg.haptic('impact', 'medium');
          onClick();
        }}
        className="pulse-glow"
        style={{
          width: 54,
          height: 54,
          borderRadius: 20,
          background: isPro 
            ? 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)' 
            : 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: isPro 
            ? '0 6px 20px rgba(245, 158, 11, 0.45)' 
            : '0 6px 20px rgba(99, 102, 241, 0.45)',
          position: 'relative',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        title="Голосовой ввод Voice Brain AI"
      >
        <Mic size={24} />

        {/* Бейджик статуса */}
        <span
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            background: isPro ? '#fbbf24' : '#10b981',
            color: '#111827',
            fontSize: 9.5,
            fontWeight: 800,
            borderRadius: 999,
            padding: '2px 5px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {isPro ? (
            <>
              <span>PRO</span>
              <Star size={9} fill="#111827" />
            </>
          ) : (
            `${remainingRequests}⚡️`
          )}
        </span>
      </button>
    </div>
  );
};
