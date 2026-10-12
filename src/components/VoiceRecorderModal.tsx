import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, X, Sparkles, Volume2, HelpCircle } from 'lucide-react';
import { voiceRecorder } from '../services/voiceRecorder';
import { tg } from '../services/telegram';

interface VoiceRecorderModalProps {
  onTranscriptComplete: (transcript: string) => void;
  onClose: () => void;
}

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({
  onTranscriptComplete,
  onClose,
}) => {
  const [seconds, setSeconds] = useState(0);
  const [volume, setVolume] = useState(0.2);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const timerRef = useRef<number | null>(null);

  // Демо-примеры для быстрого тестирования на десктопе или без микрофона
  const demoSamples = [
    'Завтра в 14:30 созвон с научруком по диплому в Zoom, потом купить подарок маме на ДР и напомни вечером сделать дз по физике к четвергу',
    'В понедельник в 9 утра лекция по высшей математике в 402 аудитории, срочно сдать реферат до 18:00 и у друга Артёма день рождения 15 октября подарить клавиатуру',
    'Напомни завтра в 11 часов подготовить презентацию по проекту и сходить на тренировку в 19:00',
  ];

  useEffect(() => {
    // Старт записи
    tg.haptic('impact', 'medium');

    voiceRecorder.startRecording({
      onInterimText: (text) => {
        setTranscript(text);
      },
      onVolumeChange: (vol) => {
        setVolume(Math.max(0.15, vol));
      },
      onError: (err) => {
        console.warn('Voice recording issue:', err);
      },
    });

    // Таймер
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev >= 60) {
          handleStop();
          return 60;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      voiceRecorder.stopRecording();
    };
  }, []);

  const handleStop = () => {
    tg.haptic('impact', 'medium');
    setIsProcessing(true);
    const finalResult = voiceRecorder.stopRecording() || transcript;

    setTimeout(() => {
      setIsProcessing(false);
      onTranscriptComplete(finalResult || demoSamples[0]);
    }, 400);
  };

  const handleApplyDemo = (sample: string) => {
    tg.haptic('selection');
    voiceRecorder.stopRecording();
    onTranscriptComplete(sample);
  };

  // Форматирование секунд в MM:SS
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Генерация высот для 14 полосок волны на основе текущей громкости
  const waveHeights = [
    0.3, 0.5, 0.8, 1.2, 1.6, 2.0, 1.7, 1.3, 1.8, 1.4, 0.9, 0.6, 0.4, 0.3
  ].map((mult, idx) => {
    const base = volume * mult * 32;
    const dynamic = Math.sin((seconds * 4) + idx) * 4;
    return Math.max(6, Math.min(48, base + dynamic));
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-sheet" 
        onClick={e => e.stopPropagation()} 
        style={{ 
          alignItems: 'center', 
          textAlign: 'center', 
          padding: '24px 20px',
          background: 'linear-gradient(180deg, #131b2e 0%, #0d121f 100%)',
        }}
      >
        {/* Кнопка закрытия */}
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--secondary)' }}>
            <Sparkles size={16} />
            <span style={{ fontWeight: 700 }}>Voice Brain AI</span>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Анимированный визуализатор звуковой волны */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          height: 60,
          margin: '16px 0 10px',
          width: '100%',
        }}>
          {waveHeights.map((h, i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: `${h}px`,
                borderRadius: 4,
                background: 'linear-gradient(180deg, #6366f1 0%, #06b6d4 100%)',
                boxShadow: '0 0 10px rgba(99, 102, 241, 0.4)',
                transition: 'height 0.08s ease',
              }}
            />
          ))}
        </div>

        {/* Таймер записи */}
        <div style={{ 
          fontSize: 20, 
          fontWeight: 800, 
          fontFamily: 'var(--font-mono)', 
          color: '#f8fafc',
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          justifyContent: 'center'
        }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-rose)', animation: 'pulseGlow 1.5s infinite' }} />
          <span>{formatTime(seconds)} / 01:00</span>
        </div>

        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 16 }}>
          Говорите свободным потоком: пары, дела, встречи, дни рождения...
        </div>

        {/* Живой распознанный текст */}
        <div style={{
          width: '100%',
          minHeight: 70,
          maxHeight: 120,
          overflowY: 'auto',
          background: 'rgba(0, 0, 0, 0.35)',
          borderRadius: 14,
          padding: '12px 14px',
          fontSize: 13,
          lineHeight: 1.5,
          color: transcript ? '#e2e8f0' : 'var(--text-dim)',
          fontStyle: transcript ? 'normal' : 'italic',
          border: '1px solid var(--border-subtle)',
          marginBottom: 16,
          textAlign: 'left',
        }}>
          {transcript || 'Слушаю ваш голос... Начните говорить...'}
        </div>

        {/* Большая кнопка остановки и разбора */}
        <button
          onClick={handleStop}
          disabled={isProcessing}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 15,
            gap: 10,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
          }}
        >
          <Square size={18} fill="#fff" />
          <span>{isProcessing ? 'Разбираю нейросетью...' : 'Остановить и разобрать (AI)'}</span>
        </button>

        {/* Быстрые примеры для проверки */}
        <div style={{ marginTop: 20, width: '100%', textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <HelpCircle size={12} />
            <span>Или нажмите готовый пример для быстрого теста:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {demoSamples.map((sample, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyDemo(sample)}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: '8px 10px',
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  lineHeight: 1.3,
                }}
              >
                💬 «{sample.slice(0, 75)}...»
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
