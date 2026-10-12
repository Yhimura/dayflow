import React, { useState } from 'react';
import { 
  GraduationCap, Clock, MapPin, User, Plus, X, 
  Video, BookOpen, AlertCircle, Calendar 
} from 'lucide-react';
import { ScheduleItem, ScheduleType } from '../types';
import { tg } from '../services/telegram';

interface ScheduleTabProps {
  schedule: ScheduleItem[];
  onAddSchedule: (item: Omit<ScheduleItem, 'id'>) => void;
  onDeleteSchedule: (id: string) => void;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({
  schedule,
  onAddSchedule,
  onDeleteSchedule,
}) => {
  const [selectedDay, setSelectedDay] = useState<number>(1); // 1 = Понедельник
  const [showAddModal, setShowAddModal] = useState(false);

  // Поля формы
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ScheduleType>('lecture');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('Ауд. 201');
  const [teacher, setTeacher] = useState('');
  const [notes, setNotes] = useState('');

  const days = [
    { id: 1, label: 'Пн' },
    { id: 2, label: 'Вт' },
    { id: 3, label: 'Ср' },
    { id: 4, label: 'Чт' },
    { id: 5, label: 'Пт' },
    { id: 6, label: 'Сб' },
  ];

  const filteredSchedule = schedule
    .filter(item => item.dayOfWeek === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    tg.haptic('notification', 'success');
    onAddSchedule({
      title,
      type,
      startTime,
      endTime,
      location,
      teacherOrHost: teacher,
      dayOfWeek: selectedDay,
      notes,
    });

    // Очистка формы
    setTitle('');
    setTeacher('');
    setNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Заголовок и кнопка добавить */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Пары и встречи</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Расписание занятий и созвонов</div>
        </div>

        <button 
          onClick={() => {
            tg.haptic('selection');
            setShowAddModal(true);
          }}
          className="btn-primary"
          style={{ padding: '8px 14px', fontSize: 13, borderRadius: 12 }}
        >
          <Plus size={16} />
          <span>Добавить</span>
        </button>
      </div>

      {/* Селектор дней недели */}
      <div style={{ display: 'flex', gap: 6, background: 'var(--bg-card)', padding: 4, borderRadius: 14 }}>
        {days.map(d => (
          <button
            key={d.id}
            onClick={() => {
              tg.haptic('selection');
              setSelectedDay(d.id);
            }}
            style={{
              flex: 1,
              padding: '10px 0',
              borderRadius: 10,
              border: 'none',
              background: selectedDay === d.id ? 'var(--primary-gradient)' : 'transparent',
              color: selectedDay === d.id ? '#fff' : 'var(--text-muted)',
              fontWeight: selectedDay === d.id ? 700 : 500,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Список занятий */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredSchedule.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '36px 16px' }}>
            <Calendar size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Нет пар на этот день!</div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 16 }}>
              Выходной или свободный день для самостоятельной работы.
            </div>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="btn-ghost"
              style={{ margin: '0 auto' }}
            >
              <Plus size={14} />
              <span>Добавить пару</span>
            </button>
          </div>
        ) : (
          filteredSchedule.map((item, index) => (
            <div key={item.id} className="glass-card" style={{ position: 'relative' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className={`badge badge-${item.type}`}>
                  {item.type === 'lecture' && 'Лекция'}
                  {item.type === 'lab' && 'Лабораторная'}
                  {item.type === 'practice' && 'Практика'}
                  {item.type === 'meeting' && 'Встреча / Звонок'}
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--secondary)' }}>
                    {item.startTime} - {item.endTime}
                  </span>
                  <button 
                    onClick={() => {
                      tg.haptic('impact', 'light');
                      onDeleteSchedule(item.id);
                    }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                {item.title}
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <MapPin size={14} color="var(--accent-rose)" />
                  <span>{item.location}</span>
                </div>

                {item.teacherOrHost && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <User size={14} color="var(--text-dim)" />
                    <span>{item.teacherOrHost}</span>
                  </div>
                )}
              </div>

              {item.notes && (
                <div style={{ 
                  marginTop: 10, padding: '8px 10px', 
                  borderRadius: 10, background: 'rgba(0,0,0,0.25)', 
                  fontSize: 12, color: 'var(--text-dim)' 
                }}>
                  📝 {item.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Модальное окно добавления пары */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Добавить пару или встречу</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Название предмета или встречи</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="напр. Базы данных"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Тип</label>
                <select 
                  className="input-glass"
                  value={type}
                  onChange={e => setType(e.target.value as ScheduleType)}
                  style={{ background: '#172033' }}
                >
                  <option value="lecture">Лекция</option>
                  <option value="practice">Практика</option>
                  <option value="lab">Лабораторная</option>
                  <option value="meeting">Встреча / Zoom</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Начало</label>
                  <input 
                    type="time" 
                    className="input-glass"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Конец</label>
                  <input 
                    type="time" 
                    className="input-glass"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Аудитория / Ссылка</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="Ауд. 412 или Zoom"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Преподаватель</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="Петров И.И."
                  value={teacher}
                  onChange={e => setTeacher(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Заметки / ДЗ к паре</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="Сдать конспект, подготовить вопросы"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
                Сохранить в расписание
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
