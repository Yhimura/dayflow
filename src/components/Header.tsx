import React from 'react';
import { Sparkles, Calendar, CheckCircle2, GraduationCap, HeartHandshake } from 'lucide-react';
import { tg } from '../services/telegram';
import { DayAnalysis } from '../types';

interface HeaderProps {
  analysis: DayAnalysis;
  activeTasksCount: number;
  scheduleCount: number;
  onOpenOptimizer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  analysis,
  activeTasksCount,
  scheduleCount,
  onOpenOptimizer,
}) => {
  const user = tg.getUser();
  const today = new Date();
  const dateFormatted = today.toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const getVerdictBadge = () => {
    switch (analysis.verdict) {
      case 'overloaded':
        return { text: 'Перегружен', color: 'badge-high' };
      case 'busy':
        return { text: 'Плотный день', color: 'badge-medium' };
      case 'relaxed':
        return { text: 'Свободно', color: 'badge-low' };
      default:
        return { text: 'Оптимально', color: 'badge-low' };
    }
  };

  const badge = getVerdictBadge();

  return (
    <header style={{ padding: '18px 16px 12px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Верхняя строчка: Профиль и дата */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={14} color="var(--primary)" />
            {dateFormatted}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 2, letterSpacing: '-0.3px' }}>
            Привет, {user.first_name || 'Студент'} 👋
          </h1>
        </div>

        <button 
          onClick={() => {
            tg.haptic('impact', 'medium');
            onOpenOptimizer();
          }}
          className="btn-primary"
          style={{ padding: '10px 14px', fontSize: 13, borderRadius: 14 }}
        >
          <Sparkles size={16} />
          <span>План дня</span>
        </button>
      </div>

      {/* Метрики дня в стеклянной плашке */}
      <div className="glass-card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <GraduationCap size={18} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Пары / встречи</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{scheduleCount} сегодня</div>
          </div>
        </div>

        <div style={{ width: 1, height: 26, background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle2 size={18} color="var(--accent-green)" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Активные дела</div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{activeTasksCount} задач</div>
          </div>
        </div>

        <div style={{ width: 1, height: 26, background: 'var(--border-subtle)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 2 }}>Баланс</div>
          <span className={`badge ${badge.color}`}>
            {badge.text}
          </span>
        </div>
      </div>
    </header>
  );
};
