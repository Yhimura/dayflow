import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, Plus, Trash2, Clock, 
  Calendar, Briefcase, GraduationCap, Home, Zap, 
  AlertCircle, ExternalLink, Bell, ChevronRight 
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

const CATEGORIES: { id: TaskCategory; label: string; icon: any; color: string }[] = [
  { id: 'work', label: 'Работа', icon: Briefcase, color: '#38bdf8' },
  { id: 'study', label: 'Учеба', icon: GraduationCap, color: '#a855f7' },
  { id: 'personal', label: 'Личное', icon: Home, color: '#10b981' },
  { id: 'urgent', label: 'Срочно', icon: Zap, color: '#f43f5e' },
];

export const TasksTab: React.FC<TasksTabProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}) => {
  const [filter, setFilter] = useState<'all' | 'work' | 'study' | 'personal'>('all');
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [timeMin, setTimeMin] = useState(30);
  const [dueTime, setDueTime] = useState('');
  
  // Дата: YYYY-MM-DD
  const getTodayISO = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const getTomorrowISO = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [taskDate, setTaskDate] = useState<string>(getTodayISO());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Синхронизируем категорию по умолчанию с выбранным фильтром
  useEffect(() => {
    if (filter === 'work') setCategory('work');
    else if (filter === 'study') setCategory('study');
    else if (filter === 'personal') setCategory('personal');
  }, [filter]);

  const handleTitleChange = (val: string) => {
    setNewTitle(val);
    const low = val.toLowerCase();
    const workWords = ['работ', 'отчет', 'клиент', 'проект', 'начальник', 'босс', 'договор', 'офис', 'совещан', 'сделк'];
    const studyWords = ['дз', 'домашк', 'реферат', 'курсач', 'лабу', 'лаба', 'учеб', 'сесси', 'препод', 'универ', 'зачет', 'экзамен'];
    if (workWords.some(w => low.includes(w))) {
      setCategory('work');
    } else if (studyWords.some(w => low.includes(w))) {
      setCategory('study');
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    tg.haptic('notification', 'success');
    const targetCategory = category;

    onAddTask({
      title: newTitle.trim(),
      category: targetCategory,
      priority,
      timeEstimateMin: timeMin,
      completed: false,
      dueTime: dueTime || undefined,
      date: taskDate || getTodayISO(),
    });

    // Если текущий фильтр скрывал бы созданную задачу, переключаем на категорию задачи
    if (filter !== 'all' && filter !== targetCategory) {
      setFilter(targetCategory as any);
    }

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

  // Форматирование даты задачи
  const formatTaskDate = (dateStr?: string, timeStr?: string) => {
    if (!dateStr && !timeStr) return null;
    const today = getTodayISO();
    const tomorrow = getTomorrowISO();

    let dateLabel = '';
    if (dateStr === today) {
      dateLabel = 'Сегодня';
    } else if (dateStr === tomorrow) {
      dateLabel = 'Завтра';
    } else if (dateStr) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        dateLabel = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
      } else {
        dateLabel = dateStr;
      }
    }

    if (dateLabel && timeStr) {
      return `${dateLabel}, ${timeStr}`;
    }
    return dateLabel || timeStr || null;
  };

  const isOverdue = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return false;
    const today = getTodayISO();
    if (dateStr < today) return true;
    if (dateStr === today && timeStr) {
      const now = new Date();
      const currentMin = now.getHours() * 60 + now.getMinutes();
      const [h, m] = timeStr.split(':').map(Number);
      return (h * 60 + m) < currentMin;
    }
    return false;
  };

  const getCategoryMeta = (cat: TaskCategory) => {
    return CATEGORIES.find(c => c.id === cat) || CATEGORIES[0];
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      
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

      {/* Информационный баннер: КУДА ПРИХОДЯТ НАПОМИНАЛКИ */}
      <div 
        className="glass-card" 
        style={{ 
          padding: '10px 14px', 
          borderColor: 'rgba(99, 102, 241, 0.3)',
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(15, 23, 42, 0.6) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ 
            width: 32, height: 32, borderRadius: 10, 
            background: 'rgba(99, 102, 241, 0.2)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
          }}>
            <Bell size={16} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f8fafc' }}>
              Напоминания приходят в Telegram-бот
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-dim)', lineHeight: 1.3 }}>
              Бот <b>@DayFlowHelper_bot</b> пришлет сообщение в личку точно ко времени
            </div>
          </div>
        </div>

        <a 
          href="https://t.me/DayFlowHelper_bot" 
          target="_blank" 
          rel="noreferrer"
          className="btn-ghost"
          style={{ 
            padding: '5px 9px', fontSize: 11, flexShrink: 0, 
            borderColor: 'var(--primary)', color: 'var(--secondary)' 
          }}
        >
          <span>Бот</span>
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Форма создания задачи */}
      <form onSubmit={handleCreateTask} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        
        {/* Поле названия */}
        <input 
          type="text"
          className="input-glass"
          placeholder="Что нужно сделать? (напр. Составить отчет по проекту)"
          value={newTitle}
          onChange={e => handleTitleChange(e.target.value)}
          required
        />

        {/* Выбор категории (Работа / Учеба / Личное / Срочно) */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 600 }}>
            Категория дела:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    tg.haptic('selection');
                    setCategory(cat.id);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    padding: '8px 4px', borderRadius: 10, border: '1px solid',
                    borderColor: isSelected ? cat.color : 'var(--border-subtle)',
                    background: isSelected ? `${cat.color}22` : 'rgba(255, 255, 255, 0.02)',
                    color: isSelected ? cat.color : 'var(--text-muted)',
                    fontSize: 11.5, fontWeight: isSelected ? 700 : 500, cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={13} color={isSelected ? cat.color : 'var(--text-dim)'} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Выбор ДАТЫ выполнения */}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>Дата и время напоминания:</span>
            {taskDate && (
              <span style={{ color: 'var(--secondary)' }}>
                {taskDate === getTodayISO() ? 'Сегодня' : taskDate === getTomorrowISO() ? 'Завтра' : taskDate}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
            {/* Кнопка "Сегодня" */}
            <button
              type="button"
              onClick={() => {
                tg.haptic('selection');
                setTaskDate(getTodayISO());
                setShowDatePicker(false);
              }}
              className="btn-ghost"
              style={{
                padding: '6px 10px', fontSize: 11,
                borderColor: taskDate === getTodayISO() && !showDatePicker ? 'var(--primary)' : 'var(--border-subtle)',
                background: taskDate === getTodayISO() && !showDatePicker ? 'var(--primary-glow)' : 'transparent',
                color: taskDate === getTodayISO() && !showDatePicker ? '#fff' : 'var(--text-muted)',
              }}
            >
              Сегодня
            </button>

            {/* Кнопка "Завтра" */}
            <button
              type="button"
              onClick={() => {
                tg.haptic('selection');
                setTaskDate(getTomorrowISO());
                setShowDatePicker(false);
              }}
              className="btn-ghost"
              style={{
                padding: '6px 10px', fontSize: 11,
                borderColor: taskDate === getTomorrowISO() && !showDatePicker ? 'var(--primary)' : 'var(--border-subtle)',
                background: taskDate === getTomorrowISO() && !showDatePicker ? 'var(--primary-glow)' : 'transparent',
                color: taskDate === getTomorrowISO() && !showDatePicker ? '#fff' : 'var(--text-muted)',
              }}
            >
              Завтра
            </button>

            {/* Календарь даты */}
            <input 
              type="date"
              value={taskDate}
              onChange={e => {
                setTaskDate(e.target.value);
                setShowDatePicker(true);
              }}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '5px 8px',
                fontSize: 11,
                flex: 1,
                minWidth: 120,
              }}
            />

            {/* Время дедлайна */}
            <input 
              type="time"
              value={dueTime}
              onChange={e => setDueTime(e.target.value)}
              placeholder="Время"
              title="Время дедлайна / напоминания"
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                color: dueTime ? 'var(--secondary)' : 'var(--text-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '5px 8px',
                fontSize: 11,
                fontWeight: dueTime ? 700 : 400,
                width: 90,
              }}
            />
          </div>
        </div>

        {/* Дополнительно: Приоритет и Оценка времени */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, paddingTop: 4 }}>
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
                {p === 'high' ? 'Срочно' : p === 'medium' ? 'Обычно' : 'Низкий'}
              </button>
            ))}
          </div>

          {/* Оценка времени */}
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
            <option value={30}>30 мин</option>
            <option value={45}>45 мин</option>
            <option value={60}>1 час</option>
            <option value={90}>1.5 часа</option>
          </select>
        </div>

        {/* Кнопка добавления */}
        <button type="submit" className="btn-primary" style={{ marginTop: 2, padding: '11px 14px', fontSize: 13, justifyContent: 'center' }}>
          <Plus size={16} />
          <span>Добавить задачу в «{getCategoryMeta(category).label}»</span>
        </button>
      </form>

      {/* Вкладки-фильтры */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {[
          { id: 'all', label: 'Все дела' },
          { id: 'work', label: '💼 Работа' },
          { id: 'study', label: '🎓 Учеба' },
          { id: 'personal', label: '🏠 Личное' },
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
              flexShrink: 0,
              background: filter === tab.id ? 'var(--primary-glow)' : 'transparent',
              borderColor: filter === tab.id ? 'var(--primary)' : 'var(--border-subtle)',
              color: filter === tab.id ? '#fff' : 'var(--text-muted)',
              fontWeight: filter === tab.id ? 700 : 500,
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
            В разделе «{filter === 'work' ? 'Работа' : filter === 'study' ? 'Учеба' : filter === 'personal' ? 'Личное' : 'Все'}» пока нет задач.
          </div>
        ) : (
          filteredTasks.map(task => {
            const catMeta = getCategoryMeta(task.category);
            const CatIcon = catMeta.icon;
            const dateDisplay = formatTaskDate(task.date, task.dueTime);
            const overdue = !task.completed && isOverdue(task.date, task.dueTime);

            return (
              <div 
                key={task.id} 
                className="glass-card" 
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px',
                  opacity: task.completed ? 0.6 : 1,
                  borderColor: task.completed ? 'transparent' : overdue ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <button
                    onClick={() => handleToggle(task.id, task.completed)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: task.completed ? 'var(--accent-green)' : 'var(--text-dim)', padding: 0 }}
                  >
                    {task.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ 
                      fontSize: 14, fontWeight: 600, 
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'var(--text-dim)' : '#f8fafc',
                      wordBreak: 'break-word',
                    }}>
                      {task.title}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 11, color: 'var(--text-dim)', marginTop: 4, alignItems: 'center' }}>
                      {/* Бейдж категории */}
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: 3, 
                        color: catMeta.color, fontWeight: 600, background: `${catMeta.color}15`,
                        padding: '1px 6px', borderRadius: 6
                      }}>
                        <CatIcon size={11} />
                        <span>{catMeta.label}</span>
                      </span>

                      {/* Дата и время */}
                      {dateDisplay && (
                        <span style={{ 
                          color: overdue ? 'var(--accent-rose)' : 'var(--secondary)', 
                          fontWeight: overdue ? 700 : 500, display: 'inline-flex', alignItems: 'center', gap: 3 
                        }}>
                          <Calendar size={11} />
                          <span>{dateDisplay}</span>
                          {overdue && <span>⚠️</span>}
                        </span>
                      )}

                      <span>⏱ {task.timeEstimateMin} мин</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                  <span className={`badge badge-${task.priority}`}>
                    {task.priority === 'high' ? 'Срочно' : task.priority === 'medium' ? 'Обычно' : 'Низкий'}
                  </span>

                  <button
                    onClick={() => {
                      tg.haptic('impact', 'medium');
                      onDeleteTask(task.id);
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}
                    title="Удалить задачу"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
