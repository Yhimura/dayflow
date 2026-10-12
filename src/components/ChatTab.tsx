import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, Bot, User, Check, 
  Calendar, FileText, Bell, Laptop 
} from 'lucide-react';
import { ChatMessage, ScheduleItem, Task, BirthdayEvent } from '../types';
import { aiPlanner } from '../services/aiPlanner';
import { tg } from '../services/telegram';

interface ChatTabProps {
  chat: ChatMessage[];
  schedule: ScheduleItem[];
  tasks: Task[];
  birthdays: BirthdayEvent[];
  onSendMessage: (text: string) => void;
  onOpenOptimizer: () => void;
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onAddSchedule: (item: Omit<ScheduleItem, 'id'>) => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  chat,
  schedule,
  tasks,
  birthdays,
  onSendMessage,
  onOpenOptimizer,
  onAddTask,
  onAddSchedule,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedObsidian, setCopiedObsidian] = useState(false);
  const [winAlertSuccess, setWinAlertSuccess] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chat]);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    tg.haptic('impact', 'medium');
    onSendMessage(text);
    setInputText('');
  };

  const handleCopyObsidian = () => {
    tg.haptic('notification', 'success');
    const analysis = aiPlanner.analyzeDay(schedule, tasks);
    const md = aiPlanner.exportToObsidianMarkdown(new Date().toISOString().split('T')[0], schedule, tasks, analysis);
    navigator.clipboard.writeText(md);
    setCopiedObsidian(true);
    setTimeout(() => setCopiedObsidian(false), 2500);
  };

  const handleWindowsAlert = () => {
    tg.haptic('notification', 'success');
    setWinAlertSuccess(true);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('⚡️ Напоминалка: Пора на пару!', {
        body: 'Высшая математика в ауд. 402 начнется через 15 минут.',
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
    setTimeout(() => setWinAlertSuccess(false), 2500);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 170px)', padding: '0 16px' }}>
      
      {/* Шапка чата */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 12,
            background: 'var(--primary-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Bot size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>AI Ассистент & MCP Hub</div>
            <div style={{ fontSize: 11, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }} />
              Подключен к памяти и органайзеру
            </div>
          </div>
        </div>

        {/* Быстрые утилиты интеграций */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button 
            onClick={handleCopyObsidian}
            className="btn-ghost"
            title="Экспорт в Obsidian Daily Note"
            style={{ padding: '6px 10px', fontSize: 11 }}
          >
            {copiedObsidian ? <Check size={14} color="var(--accent-green)" /> : <FileText size={14} />}
            <span>Obsidian</span>
          </button>

          <button 
            onClick={handleWindowsAlert}
            className="btn-ghost"
            title="Тест оповещения Windows"
            style={{ padding: '6px 10px', fontSize: 11 }}
          >
            {winAlertSuccess ? <Check size={14} color="var(--accent-green)" /> : <Bell size={14} />}
            <span>WinAlert</span>
          </button>
        </div>
      </div>

      {/* Список сообщений */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 4, paddingBottom: 10 }}>
        {chat.map(msg => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
              }}
            >
              <div 
                style={{
                  maxWidth: '85%',
                  padding: '12px 14px',
                  borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: isUser ? 'var(--primary-gradient)' : 'var(--bg-card)',
                  border: isUser ? 'none' : '1px solid var(--border-subtle)',
                  color: '#fff',
                  fontSize: 13.5,
                  lineHeight: 1.5,
                  whiteSpace: 'pre-line',
                  boxShadow: isUser ? '0 4px 15px var(--primary-glow)' : 'var(--shadow-card)',
                }}
              >
                {msg.text}
              </div>

              {/* Саджесты (быстрые ответы) */}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8, maxWidth: '90%' }}>
                  {msg.suggestions.map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(sug)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 12,
                        padding: '6px 10px',
                        fontSize: 11.5,
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <form 
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: 'flex', gap: 8, alignItems: 'center',
          background: 'var(--bg-card)',
          padding: '8px 10px',
          borderRadius: 16,
          border: '1px solid var(--border-subtle)',
        }}
      >
        <input 
          type="text"
          className="input-glass"
          placeholder="Спроси или напиши: 'добавь пару', 'напомни...'"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          style={{ border: 'none', background: 'transparent', padding: '8px 6px', fontSize: 13.5 }}
        />

        <button 
          type="submit"
          className="btn-primary"
          style={{ width: 40, height: 40, padding: 0, borderRadius: 12, flexShrink: 0 }}
        >
          <Send size={18} />
        </button>
      </form>

    </div>
  );
};
