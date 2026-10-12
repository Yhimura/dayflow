import React, { useState } from 'react';
import { 
  Check, X, Sparkles, GraduationCap, CheckSquare, 
  Cake, Clock, MapPin, Gift, AlertCircle 
} from 'lucide-react';
import { ExtractedVoiceData, ScheduleItem, Task, BirthdayEvent } from '../types';
import { tg } from '../services/telegram';
import confetti from 'canvas-confetti';

interface VoiceBrainConfirmationModalProps {
  data: ExtractedVoiceData;
  onApply: (selected: {
    scheduleItems: Omit<ScheduleItem, 'id'>[];
    tasks: Omit<Task, 'id'>[];
    birthdays: Omit<BirthdayEvent, 'id'>[];
  }) => void;
  onClose: () => void;
}

export const VoiceBrainConfirmationModal: React.FC<VoiceBrainConfirmationModalProps> = ({
  data,
  onApply,
  onClose,
}) => {
  // Выбранные элементы (по умолчанию выбраны все)
  const [selectedSchedule, setSelectedSchedule] = useState<number[]>(
    data.scheduleItems.map((_, i) => i)
  );
  const [selectedTasks, setSelectedTasks] = useState<number[]>(
    data.tasks.map((_, i) => i)
  );
  const [selectedBirthdays, setSelectedBirthdays] = useState<number[]>(
    data.birthdays.map((_, i) => i)
  );

  const toggleSchedule = (idx: number) => {
    tg.haptic('selection');
    setSelectedSchedule(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const toggleTask = (idx: number) => {
    tg.haptic('selection');
    setSelectedTasks(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const toggleBirthday = (idx: number) => {
    tg.haptic('selection');
    setSelectedBirthdays(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const totalSelected = selectedSchedule.length + selectedTasks.length + selectedBirthdays.length;

  const handleApplyAll = () => {
    tg.haptic('notification', 'success');
    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#06b6d4', '#10b981'],
    });

    onApply({
      scheduleItems: data.scheduleItems.filter((_, i) => selectedSchedule.includes(i)),
      tasks: data.tasks.filter((_, i) => selectedTasks.includes(i)),
      birthdays: data.birthdays.filter((_, i) => selectedBirthdays.includes(i)),
    });

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
        
        {/* Шапка */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 12,
              background: 'var(--primary-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>Результат разбора речи</h3>
              <div style={{ fontSize: 11, color: 'var(--accent-green)' }}>
                {data.summary}
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

        {/* Распознанный текст в компактном блоке */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          borderRadius: 12,
          padding: '8px 12px',
          fontSize: 12,
          color: 'var(--text-muted)',
          marginBottom: 14,
          border: '1px solid var(--border-subtle)',
          fontStyle: 'italic',
        }}>
          «{data.rawTranscript}»
        </div>

        {/* Список сущностей */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, paddingRight: 2, marginBottom: 16 }}>
          
          {/* 1. Пары и встречи */}
          {data.scheduleItems.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <GraduationCap size={15} />
                <span>Пары и встречи ({data.scheduleItems.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.scheduleItems.map((item, idx) => {
                  const isChecked = selectedSchedule.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleSchedule(idx)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: 12,
                        background: isChecked ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--primary)' : 'var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{item.title}</div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                          <span>⏱ {item.startTime} - {item.endTime}</span>
                          <span>📍 {item.location}</span>
                        </div>
                      </div>

                      <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: isChecked ? 'var(--primary)' : 'transparent',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--primary)' : 'var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isChecked && <Check size={14} color="#fff" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Задачи */}
          {data.tasks.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-green)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckSquare size={15} />
                <span>Задачи ({data.tasks.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.tasks.map((task, idx) => {
                  const isChecked = selectedTasks.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleTask(idx)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: 12,
                        background: isChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--accent-green)' : 'var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{task.title}</div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                          <span>~{task.timeEstimateMin} мин</span>
                          {task.dueTime && <span>Дедлайн: {task.dueTime}</span>}
                          <span>Приоритет: {task.priority === 'high' ? '🔴 Высокий' : '🟡 Обычный'}</span>
                        </div>
                      </div>

                      <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: isChecked ? 'var(--accent-green)' : 'transparent',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--accent-green)' : 'var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isChecked && <Check size={14} color="#fff" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Дни рождения */}
          {data.birthdays.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-rose)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Cake size={15} />
                <span>Дни рождения ({data.birthdays.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {data.birthdays.map((bday, idx) => {
                  const isChecked = selectedBirthdays.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleBirthday(idx)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 12px', borderRadius: 12,
                        background: isChecked ? 'rgba(236, 72, 153, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--accent-rose)' : 'var(--border-subtle)',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{bday.name}</div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-dim)', marginTop: 3 }}>
                          <span>📅 {bday.birthDate}</span>
                          {bday.giftIdeas.length > 0 && <span>🎁 {bday.giftIdeas.join(', ')}</span>}
                        </div>
                      </div>

                      <div style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: isChecked ? 'var(--accent-rose)' : 'transparent',
                        border: '1px solid',
                        borderColor: isChecked ? 'var(--accent-rose)' : 'var(--border-subtle)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {isChecked && <Check size={14} color="#fff" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Кнопка применить */}
        <button
          onClick={handleApplyAll}
          disabled={totalSelected === 0}
          className="btn-primary"
          style={{ width: '100%', padding: '13px', fontSize: 14 }}
        >
          <Check size={18} />
          <span>Применить выбранное ({totalSelected} шт.)</span>
        </button>

      </div>
    </div>
  );
};
