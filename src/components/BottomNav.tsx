import React from 'react';
import { Calendar, GraduationCap, MessageSquare, CheckSquare, Cake } from 'lucide-react';
import { tg } from '../services/telegram';

export type TabType = 'day' | 'schedule' | 'chat' | 'tasks' | 'birthdays';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  activeTasksCount: number;
  scheduleCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  activeTasksCount,
  scheduleCount,
}) => {
  const tabs = [
    { id: 'day', label: 'День', icon: Calendar },
    { id: 'schedule', label: 'Пары', icon: GraduationCap, badge: scheduleCount },
    { id: 'chat', label: 'AI Чат', icon: MessageSquare, isSpecial: true },
    { id: 'tasks', label: 'Дела', icon: CheckSquare, badge: activeTasksCount },
    { id: 'birthdays', label: 'Дни рожд.', icon: Cake },
  ];

  return (
    <nav 
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        background: 'rgba(11, 16, 29, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 10px 14px',
        zIndex: 100,
      }}
    >
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => {
              tg.haptic('selection');
              onChangeTab(tab.id as TabType);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              position: 'relative',
              padding: '4px 8px',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Иконка */}
            <div 
              style={{
                width: 38,
                height: 38,
                borderRadius: tab.isSpecial ? '14px' : '10px',
                background: tab.isSpecial 
                  ? 'var(--primary-gradient)' 
                  : isActive 
                    ? 'rgba(99, 102, 241, 0.15)' 
                    : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: tab.isSpecial ? '0 4px 15px var(--primary-glow)' : 'none',
                transform: isActive ? 'scale(1.08)' : 'scale(1)',
                transition: 'transform 0.2s',
              }}
            >
              <Icon 
                size={20} 
                color={tab.isSpecial ? '#fff' : isActive ? 'var(--primary)' : 'var(--text-dim)'} 
              />
            </div>

            {/* Лейбл */}
            <span 
              style={{
                fontSize: 10.5,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : 'var(--text-dim)',
              }}
            >
              {tab.label}
            </span>

            {/* Бейджик со счетчиком */}
            {Boolean(tab.badge && tab.badge > 0) && (
              <span 
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 8,
                  background: 'var(--accent-rose)',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 999,
                  minWidth: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 2px 6px rgba(244, 63, 94, 0.5)',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
