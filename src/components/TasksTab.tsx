import React, { useState } from 'react';
import { 
  CheckCircle2, Circle, Plus, Trash2, Clock, 
  Tag, AlertCircle, Sparkles, Filter 
} from 'lucide-react';
import { Task, Priority, TaskCategory } from '../types';
import { tg } from '../services/telegram';
import confetti from 'canvas-confetti';

interface TasksTabProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'study' | 'work' | 'personal'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('high');
  const [category, setCategory] = useState<TaskCategory>('study');
  const [timeMin, setTimeMin] = useState(25);
  const [dueTime, setDueTime] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    tg.haptic('notification', 'success');
    onAddTask({
      title: newTitle.trim(),
      category,
      priority,
      timeEstimateMin: timeMin,
      completed: false,
      dueTime: dueTime || undefined,
      date: todayStr,
    });

    setNewTitle('');
    setDueTime('');
  };

  const handleToggle = (id: string, currentCompleted: boolean) => {
    if (!currentCompleted) {
      tg.haptic('notification', 'success');
      confetti({
        particleCount: 25,
        spread: 50,
        origin: { y: 0.75 },
      });
    } else {
      tg.haptic('selection');
    }
    onToggleTask(id);
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.category === filter;
  });

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Заголовок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Дела и напоминания</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Выполнено {completedCount} из {tasks.length}
          </div>
        </div>

        <div style={{ 
          fontSize: 12, fontWeight: 700, 
          padding: '6px 10px', borderRadius: 10,
          background: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)'
        }}>
          {tasks.length > 0 ? `${Math.round((completedCount / tasks.length) * 100)}% готово` : '0%'}
        </div>
      </div>

      {/* Форма быстрого создания задачи */}
      <form onSubmit={handleCreateTask} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input 
          type="text"
          className="input-glass"
          placeholder="Что нужно сделать? (напр. Дописать курсач)"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          required
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          
          {/* Приоритет */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['high', 'medium', 'low'] as Priority[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  tg.haptic('selection');
                  setPriority(p);
                }}
                className={`badge badge-${p}`}
                style={{ 
                  cursor: 'pointer',
                  opacity: priority === p ? 1 : 0.45,
                  transform: priority === p ? 'scale(1.05)' : 'none',
                }}
              >
                {p === 'high' ? 'Срочно' : p === 'medium' ? 'Важно' : 'Низкий'}
              </button>
            ))}
          </div>

          {/* Оценка времени и дедлайн */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={timeMin}
              onChange={e => setTimeMin(Number(e.target.value))}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '4px 6px',
                fontSize: 11,
              }}
            >
              <option value={15}>15 мин</option>
              <option value={25}>25 мин (Помодоро)</option>
              <option value={45}>45 мин</option>
              <option value={90}>1.5 часа</option>
            </select>

            <input 
              type="time"
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
              placeholder="Дедлайн"
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '4px 6px',
                fontSize: 11,
              }}
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ marginTop: 4, padding: '10px 14px', fontSize: 13 }}>
          <Plus size={16} />
          <span>Добавить задачу</span>
        </button>
      </form>

      {/* Фильтры */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { id: 'all', label: 'Все' },
          { id: 'study', label: 'Учеба' },
          { id: 'work', label: 'Работа' },
          { id: 'personal', label: 'Личное' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              tg.haptic('selection');
              setFilter(tab.id as any);
            }}
            className="btn-ghost"
            style={{
              padding: '6px 12px',
              fontSize: 12,
              borderRadius: 10,
              background: filter === tab.id ? 'var(--primary-glow)' : 'transparent',
              borderColor: filter === tab.id ? 'var(--primary)' : 'var(--border-subtle)',
              color: filter === tab.id ? '#fff' : 'var(--text-muted)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Список задач */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filteredTasks.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-dim)' }}>
            В этой категории нет задач.
          </div>
        ) : (
          filteredTasks.map(task => (
            <div 
              key={task.id} 
              className="glass-card" 
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px',
                opacity: task.completed ? 0.6 : 1,
                borderColor: task.completed ? 'transparent' : 'var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                <button
                  onClick={() => handleToggle(task.id, task.completed)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: task.completed ? 'var(--accent-green)' : 'var(--text-dim)' }}
                >
                  {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ 
                    fontSize: 14, fontWeight: 600, 
                    textDecoration: task.completed ? 'line-through' : 'none',
                    color: task.completed ? 'var(--text-dim)' : 'var(--text-main)',
                  }}>
                    {task.title}
                  </div>

                  <div style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                    <span>⏱ {task.timeEstimateMin} мин</span>
                    {task.dueTime && <span>• До {task.dueTime}</span>}
                    <span>• {task.category === 'study' ? 'Учеба' : task.category === 'work' ? 'Работа' : 'Личное'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge badge-${task.priority}`}>
                  {task.priority === 'high' ? 'Срочно' : task.priority === 'medium' ? 'Важно' : 'Низкий'}
                </span>

                <button
                  onClick={() => {
                    tg.haptic('impact', 'medium');
                    onDeleteTask(task.id);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
