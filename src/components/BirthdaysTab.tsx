import React, { useState } from 'react';
import { 
  Cake, Gift, Plus, Calendar, X, Sparkles, 
  Heart, Users, Briefcase, Smile, MessageCircle 
} from 'lucide-react';
import { BirthdayEvent, RelationshipType } from '../types';
import { tg } from '../services/telegram';
import confetti from 'canvas-confetti';

interface BirthdaysTabProps {
  birthdays: BirthdayEvent[];
  onAddBirthday: (bday: Omit<BirthdayEvent, 'id'>) => void;
  onDeleteBirthday: (id: string) => void;
}

export const BirthdaysTab: React.FC<BirthdaysTabProps> = ({
  birthdays,
  onAddBirthday,
  onDeleteBirthday,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Поля формы
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<RelationshipType>('friend');
  const [birthDate, setBirthDate] = useState('10-15');
  const [giftIdeasInput, setGiftIdeasInput] = useState('');
  const [notes, setNotes] = useState('');

  // Расчет оставшихся дней до ДР
  const getDaysUntil = (bDateStr: string) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const parts = bDateStr.split('-');
    const month = parseInt(parts[parts.length - 2], 10) - 1;
    const day = parseInt(parts[parts.length - 1], 10);

    let nextBirthday = new Date(currentYear, month, day);
    if (nextBirthday.getTime() < today.setHours(0, 0, 0, 0)) {
      nextBirthday = new Date(currentYear + 1, month, day);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    tg.haptic('notification', 'success');
    const giftIdeas = giftIdeasInput
      .split(',')
      .map(g => g.trim())
      .filter(Boolean);

    onAddBirthday({
      name: name.trim(),
      relationship,
      birthDate,
      giftIdeas: giftIdeas.length > 0 ? giftIdeas : ['Спросить у именинника'],
      notes,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    });

    setName('');
    setGiftIdeasInput('');
    setNotes('');
    setShowModal(false);
  };

  const sortedBirthdays = [...birthdays].sort((a, b) => getDaysUntil(a.birthDate) - getDaysUntil(b.birthDate));

  return (
    <div className="animate-fade-in" style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Заголовок */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 800 }}>Дни рождения</h2>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Не забудь поздравить и подготовить подарок</div>
        </div>

        <button 
          onClick={() => {
            tg.haptic('selection');
            setShowModal(true);
          }}
          className="btn-primary"
          style={{ padding: '8px 14px', fontSize: 13, borderRadius: 12 }}
        >
          <Plus size={16} />
          <span>Добавить</span>
        </button>
      </div>

      {/* Список именинников */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {sortedBirthdays.map(bday => {
          const daysLeft = getDaysUntil(bday.birthDate);
          const isSoon = daysLeft <= 7;
          const isToday = daysLeft === 0;

          return (
            <div 
              key={bday.id} 
              className="glass-card"
              style={{
                borderColor: isToday ? 'var(--accent-rose)' : isSoon ? 'rgba(236, 72, 153, 0.3)' : 'var(--border-subtle)',
                background: isSoon ? 'linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(26, 35, 54, 0.7) 100%)' : 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: bday.avatarColor,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, color: '#fff', fontWeight: 800,
                    boxShadow: `0 4px 15px ${bday.avatarColor}55`
                  }}>
                    {isToday ? '🎉' : '🎂'}
                  </div>

                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{bday.name}</h3>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span>{bday.birthDate}</span>
                      <span>•</span>
                      <span>
                        {bday.relationship === 'friend' && 'Друг'}
                        {bday.relationship === 'family' && 'Семья'}
                        {bday.relationship === 'classmate' && 'Одногруппник'}
                        {bday.relationship === 'colleague' && 'Коллега'}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${isToday ? 'badge-high' : isSoon ? 'badge-medium' : 'badge-low'}`}>
                    {isToday ? 'СЕГОДНЯ!' : daysLeft === 1 ? 'Завтра!' : `Через ${daysLeft} дн`}
                  </span>
                </div>
              </div>

              {/* Идеи подарков */}
              {bday.giftIdeas.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Gift size={12} color="var(--accent-rose)" />
                    <span>Идеи подарка:</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {bday.giftIdeas.map((idea, i) => (
                      <span 
                        key={i} 
                        style={{
                          fontSize: 11, padding: '4px 8px', borderRadius: 8,
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-muted)'
                        }}
                      >
                        🎁 {idea}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Заметки */}
              {bday.notes && (
                <div style={{ 
                  marginTop: 10, fontSize: 12, color: 'var(--text-dim)', 
                  background: 'rgba(0,0,0,0.25)', padding: '8px 10px', borderRadius: 10 
                }}>
                  💬 {bday.notes}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  onClick={() => {
                    tg.haptic('impact', 'medium');
                    onDeleteBirthday(bday.id);
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', fontSize: 12, cursor: 'pointer' }}
                >
                  Удалить
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Модалка добавления ДР */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700 }}>Добавить день рождения</h3>
              <button 
                onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Имя именинника</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="напр. Максим"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Кто это?</label>
                  <select 
                    className="input-glass"
                    value={relationship}
                    onChange={e => setRelationship(e.target.value as RelationshipType)}
                    style={{ background: '#172033' }}
                  >
                    <option value="friend">Друг</option>
                    <option value="family">Семья</option>
                    <option value="classmate">Одногруппник</option>
                    <option value="colleague">Коллега</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Дата (ММ-ДД)</label>
                  <input 
                    type="text" 
                    className="input-glass"
                    placeholder="10-25"
                    value={birthDate}
                    onChange={e => setBirthDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Идеи подарков (через запятую)</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="напр. Наушники, книга, сертификат"
                  value={giftIdeasInput}
                  onChange={e => setGiftIdeasInput(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>Заметки (где празднуем и т.д.)</label>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="Скинуться по 1000 руб, сбор в 18:00"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: 8 }}>
                Сохранить событие
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
