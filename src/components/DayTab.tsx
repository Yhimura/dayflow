import React from 'react';
import { 
  Clock, MapPin, Circle, 
  ChevronRight, Sparkles, Plus, GraduationCap, Cake, ArrowUpRight 
} from 'lucide-react';
import { ScheduleItem, Task, BirthdayEvent, DayAnalysis } from '../types';
import { tg } from '../services/telegram';
import confetti from 'canvas-confetti';

interface DayTabProps {
  schedule: ScheduleItem[];
  tasks: Task[];
  birthdays: BirthdayEvent[];
  analysis: DayAnalysis;
  onToggleTask: (taskId: string) => void;
  onNavigateTab: (tab: 'schedule' | 'tasks' | 'birthdays' | 'chat') => void;
  onOpenOptimizer: () => void;
}

export const DayTab: React.FC<DayTabProps> = ({
  schedule,
  tasks,
  birthdays,
  analysis,
  onToggleTask,
  onNavigateTab,
  onOpenOptimizer,
}) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let activeOrNextItem: ScheduleItem | null = null;
  let statusText = 'Все пары на сегодня завершены 🎉';
  let isCurrent = false;

  for (const item of schedule) {
    const [startH, startM] = item.startTime.split(':').map(Number);
    const [endH, endM] = item.endTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    if (currentMinutes >= startMin && currentMinutes <= endMin) {
      activeOrNextItem = item;
      statusText = 'Идет прямо сейчас';
      isCurrent = true;
      break;
    } else if (currentMinutes < startMin) {
      activeOrNextItem = item;
      const diff = startMin - currentMinutes;
      statusText = diff > 60 ? `Через ${Math.floor(diff / 60)} ч ${diff % 60} мин` : `Через ${diff} мин`;
      break;
    }
  }

  if (!activeOrNextItem && schedule.length > 0) {
    activeOrNextItem = schedule[0];
    statusText = 'Первое занятие на сегодня';
  }

  const upcomingBirthday = birthdays.length > 0 ? birthdays[0] : null;
  const activeTasks = tasks.filter(t => !t.completed).slice(0, 3);

  const handleTaskCheck = (taskId: string) => {
    tg.haptic('notification', 'success');
    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#10b981', '#f59e0b'],
    });
    onToggleTask(taskId);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 16px' }}>
      
      {/* 1. Блок текущей / ближайшей пары */}
      {activeOrNextItem ? (
        <div 
          className="glass-card pulse-glow"
          style={{
            background: isCurrent 
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(26, 35, 54, 0.8) 100%)' 
              : 'var(--bg-card)',
            borderColor: isCurrent ? 'var(--primary)' : 'var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ 
              fontSize: 12, fontWeight: 700, 
              color: isCurrent ? 'var(--secondary)' : 'var(--accent-amber)',
              display: 'flex', alignItems: 'center', gap: 6 
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: isCurrent ? 'var(--secondary)' : 'var(--accent-amber)' }} />
              {statusText}
            </span>

            <span className={`badge badge-${activeOrNextItem.type}`}>
              {activeOrNextItem.type === 'lecture' && 'Лекция'}
              {activeOrNextItem.type === 'lab' && 'Лабораторная'}
              {activeOrNextItem.type === 'practice' && 'Практика'}
              {activeOrNextItem.type === 'meeting' && 'Встреча'}
            </span>
          </div>

          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            {activeOrNextItem.title}
          </h3>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={14} color="var(--primary)" />
              <span>{activeOrNextItem.startTime} - {activeOrNextItem.endTime}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <MapPin size={14} color="var(--accent-rose)" />
              <span>{activeOrNextItem.location}</span>
            </div>
          </div>

          {activeOrNextItem.notes && (
            <div style={{ 
              background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '8px 12px', 
              fontSize: 12, color: 'var(--text-dim)', marginBottom: 12 
            }}>
              💡 {activeOrNextItem.notes}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={() => onNavigateTab('schedule')} 
              className="btn-ghost"
              style={{ fontSize: 12, padding: '6px 12px' }}
            >
              <span>Все расписание</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="glass-card" 
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(26, 35, 54, 0.6) 100%)',
            borderColor: 'rgba(99, 102, 241, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <GraduationCap size={22} color="var(--primary)" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Расписание чисто</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Добавьте первую пару или встречу</div>
            </div>
          </div>

          <button 
            onClick={() => onNavigateTab('schedule')}
            className="btn-ghost"
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            <Plus size={14} />
            <span>Добавить</span>
          </button>
        </div>
      )}

      {/* 2. Ближайший День Рождения */}
      {upcomingBirthday ? (
        <div 
          onClick={() => {
            tg.haptic('selection');
            onNavigateTab('birthdays');
          }}
          className="glass-card glass-card-interactive" 
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.12) 0%, rgba(26, 35, 54, 0.65) 100%)',
            borderColor: 'rgba(236, 72, 153, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: upcomingBirthday.avatarColor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 18,
              boxShadow: `0 4px 15px ${upcomingBirthday.avatarColor}66`
            }}>
              🎂
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--accent-rose)', fontWeight: 700 }}>СКОРО ДЕНЬ РОЖДЕНИЯ</div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{upcomingBirthday.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                {upcomingBirthday.birthDate} • {upcomingBirthday.giftIdeas[0] || 'Выбрать подарок'}
              </div>
            </div>
          </div>
          <ChevronRight size={18} color="var(--text-dim)" />
        </div>
      ) : (
        <div 
          onClick={() => onNavigateTab('birthdays')}
          className="glass-card glass-card-interactive"
          style={{ 
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderStyle: 'dashed'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(236, 72, 153, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Cake size={20} color="var(--accent-rose)" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Дни рождения близких</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Сохраните даты, чтобы бот напомнил заранее</div>
            </div>
          </div>
          <Plus size={16} color="var(--text-dim)" />
        </div>
      )}

      {/* 3. Горящие дела на сегодня */}
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚡️ Дела на сегодня</span>
          </h4>
          <button 
            onClick={() => onNavigateTab('tasks')} 
            className="btn-ghost"
            style={{ fontSize: 11, padding: '4px 8px' }}
          >
            {tasks.length > 0 ? `Все дела (${tasks.length})` : 'Добавить задачу'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {activeTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-dim)', fontSize: 13 }}>
              {tasks.length === 0 ? 'Список задач пуст. Добавьте свои первые дела!' : 'Все дела выполнены! Отличная работа 🚀'}
            </div>
          ) : (
            activeTasks.map(task => (
              <div 
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                  <button 
                    onClick={() => handleTaskCheck(task.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
                  >
                    <Circle size={20} />
                  </button>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {task.title}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)', display: 'flex', gap: 8, marginTop: 2 }}>
                      {task.dueTime && <span>до {task.dueTime}</span>}
                      <span>~{task.timeEstimateMin} мин</span>
                    </div>
                  </div>
                </div>

                <span className={`badge badge-${task.priority}`}>
                  {task.priority === 'high' ? 'Срочно' : task.priority === 'medium' ? 'Важно' : 'Низкий'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. AI-Совет дня: как все успеть */}
      <div 
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(26, 35, 54, 0.6) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.25)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={16} color="var(--accent-green)" />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-green)' }}>
            AI-стратегия дня
          </span>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>
          {analysis.recommendations[0] || 'День сбалансирован. Наполняйте расписание, и AI составит оптимальный поминутный план!'}
        </p>

        <button 
          onClick={onOpenOptimizer}
          className="btn-primary" 
          style={{ width: '100%', fontSize: 13, padding: '10px 14px' }}
        >
          <span>Сгенерировать поминутный план дня</span>
          <ArrowUpRight size={16} />
        </button>
      </div>

    </div>
  );
};
