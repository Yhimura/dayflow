import React, { useState, useEffect, useRef } from 'react';
import { storage } from './services/storage';
import { aiPlanner } from './services/aiPlanner';
import { tg } from './services/telegram';
import { notificationService } from './services/notificationService';
import { voiceBrainParser } from './services/voiceBrainParser';
import { starsPayment } from './services/starsPayment';
import { 
  Task, ScheduleItem, BirthdayEvent, ChatMessage, 
  DayPlanSlot, NotificationSettings, ExtractedVoiceData, UserSubscription 
} from './types';
import { Header } from './components/Header';
import { DayTab } from './components/DayTab';
import { ScheduleTab } from './components/ScheduleTab';
import { TasksTab } from './components/TasksTab';
import { BirthdaysTab } from './components/BirthdaysTab';
import { ChatTab } from './components/ChatTab';
import { BottomNav, TabType } from './components/BottomNav';
import { DayPlannerModal } from './components/DayPlannerModal';
import { SettingsModal } from './components/SettingsModal';
import { VoiceRecorderModal } from './components/VoiceRecorderModal';
import { VoiceBrainConfirmationModal } from './components/VoiceBrainConfirmationModal';
import { PaywallModal } from './components/PaywallModal';
import { VoiceFloatingButton } from './components/VoiceFloatingButton';
import { AdminModal } from './components/AdminModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('day');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayEvent[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(storage.getSettings());
  const [subscription, setSubscription] = useState<UserSubscription>(starsPayment.getSubscription());

  // Модальные окна
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showVoiceConfirmation, setShowVoiceConfirmation] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const [dayPlanSlots, setDayPlanSlots] = useState<DayPlanSlot[]>([]);
  const [extractedVoiceData, setExtractedVoiceData] = useState<ExtractedVoiceData | null>(null);

  // Отслеживание отправленных напоминаний во избежание дубликатов
  const sentRemindersRef = useRef<Set<string>>(new Set());

  // Загрузка начальных данных и инициализация Telegram
  useEffect(() => {
    tg.init();
    setTasks(storage.getTasks());
    setSchedule(storage.getSchedule());
    setBirthdays(storage.getBirthdays());
    setChat(storage.getChat());

    const loadedSettings = storage.getSettings();
    setSettings(loadedSettings);

    const loadedSub = starsPayment.getSubscription();
    setSubscription(loadedSub);
  }, []);

  // Фоновый мониторинг напоминаний в Telegram бот
  useEffect(() => {
    if (!settings.enableTelegramNotify || !settings.chatId) return;

    const checkReminders = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const todayDateStr = now.toDateString();

      // 1. Проверка пар (с допуском окна в 1 минуту для надежности таймера)
      schedule.forEach(item => {
        const [startH, startM] = item.startTime.split(':').map(Number);
        const itemStartMin = startH * 60 + startM;
        const diff = itemStartMin - currentMinutes;

        if (diff <= settings.classRemindMinutes && diff >= settings.classRemindMinutes - 1) {
          const key = `class-${item.id}-${todayDateStr}`;
          if (!sentRemindersRef.current.has(key)) {
            sentRemindersRef.current.add(key);
            notificationService.sendClassReminder(settings, item);
          }
        }
      });

      // 2. Проверка дедлайнов задач
      tasks.forEach(task => {
        if (task.completed || !task.dueTime) return;
        const [dueH, dueM] = task.dueTime.split(':').map(Number);
        const taskDueMin = dueH * 60 + dueM;
        const diff = taskDueMin - currentMinutes;

        if (diff <= settings.taskRemindMinutes && diff >= settings.taskRemindMinutes - 1) {
          const key = `task-${task.id}-${todayDateStr}`;
          if (!sentRemindersRef.current.has(key)) {
            sentRemindersRef.current.add(key);
            notificationService.sendTaskReminder(settings, task);
          }
        }
      });

      // 3. Проверка дней рождения (один раз в день утром)
      birthdays.forEach(bday => {
        const [mStr, dStr] = bday.birthDate.split('-').map(Number);
        const bdayThisYear = new Date(now.getFullYear(), mStr - 1, dStr);
        const diffDays = Math.ceil((bdayThisYear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays >= 0 && diffDays <= settings.birthdayRemindDays) {
          const key = `bday-${bday.id}-${todayDateStr}`;
          if (!sentRemindersRef.current.has(key)) {
            sentRemindersRef.current.add(key);
            notificationService.sendBirthdayReminder(settings, bday, diffDays);
          }
        }
      });

      // 4. Утренний дайджест
      if (settings.morningSummaryEnabled && settings.morningSummaryTime) {
        const [sumH, sumM] = settings.morningSummaryTime.split(':').map(Number);
        const sumMin = sumH * 60 + sumM;
        if (currentMinutes === sumMin) {
          const key = `morning-summary-${todayDateStr}`;
          if (!sentRemindersRef.current.has(key)) {
            sentRemindersRef.current.add(key);
            notificationService.sendMorningDigest(settings, schedule, tasks, birthdays);
          }
        }
      }
    };

    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [schedule, tasks, birthdays, settings]);

  // Синхронизация данных
  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    storage.saveTasks(newTasks);
  };

  const updateSchedule = (newSchedule: ScheduleItem[]) => {
    setSchedule(newSchedule);
    storage.saveSchedule(newSchedule);
  };

  const updateBirthdays = (newBirthdays: BirthdayEvent[]) => {
    setBirthdays(newBirthdays);
    storage.saveBirthdays(newBirthdays);
  };

  const updateChat = (newChat: ChatMessage[]) => {
    setChat(newChat);
    storage.saveChat(newChat);
  };

  const handleSaveSettings = (newSettings: NotificationSettings) => {
    setSettings(newSettings);
    storage.saveSettings(newSettings);
  };

  const handleClearAll = () => {
    storage.clearAllData();
    setTasks([]);
    setSchedule([]);
    setBirthdays([]);
    setChat(storage.getChat());
    tg.showAlert('Все данные очищены. Органайзер готов к работе с чистого листа!');
  };

  // Обработчики задач
  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    updateTasks(updated);
  };

  const handleAddTask = (taskData: Omit<Task, 'id'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
    };
    updateTasks([newTask, ...tasks]);
  };

  const handleDeleteTask = (taskId: string) => {
    updateTasks(tasks.filter(t => t.id !== taskId));
  };

  // Обработчики расписания
  const handleAddSchedule = (scheduleData: Omit<ScheduleItem, 'id'>) => {
    const newItem: ScheduleItem = {
      ...scheduleData,
      id: `sch-${Date.now()}`,
    };
    updateSchedule([...schedule, newItem]);
  };

  const handleDeleteSchedule = (id: string) => {
    updateSchedule(schedule.filter(s => s.id !== id));
  };

  // Обработчики дней рождения
  const handleAddBirthday = (bdayData: Omit<BirthdayEvent, 'id'>) => {
    const newBday: BirthdayEvent = {
      ...bdayData,
      id: `bday-${Date.now()}`,
    };
    updateBirthdays([...birthdays, newBday]);
  };

  const handleDeleteBirthday = (id: string) => {
    updateBirthdays(birthdays.filter(b => b.id !== id));
  };

  // Открытие оптимизатора дня
  const handleOpenOptimizer = () => {
    const slots = aiPlanner.generateOptimizedDayPlan(schedule, tasks);
    setDayPlanSlots(slots);
    setShowOptimizer(true);
  };

  // ==========================================
  // 🎙 VOICE BRAIN AI ОБРАБОТЧИКИ
  // ==========================================

  const handleOpenVoiceBrain = () => {
    const check = starsPayment.canUseVoiceBrain();
    if (!check.allowed) {
      setShowPaywall(true);
      return;
    }
    setShowVoiceRecorder(true);
  };

  const handleVoiceTranscriptComplete = (transcript: string) => {
    setShowVoiceRecorder(false);

    if (!transcript.trim()) {
      tg.showAlert('Речь не распознана. Попробуйте еще раз.');
      return;
    }

    const extracted = voiceBrainParser.parseTranscript(transcript);
    setExtractedVoiceData(extracted);
    setShowVoiceConfirmation(true);
  };

  const handleApplyVoiceData = (selected: {
    scheduleItems: Omit<ScheduleItem, 'id'>[];
    tasks: Omit<Task, 'id'>[];
    birthdays: Omit<BirthdayEvent, 'id'>[];
  }) => {
    starsPayment.consumeVoiceRequest();
    setSubscription(starsPayment.getSubscription());

    const newSchedule: ScheduleItem[] = selected.scheduleItems.map((item, idx) => ({
      ...item,
      id: `sch-voice-${Date.now()}-${idx}`,
    }));

    const newTasksList: Task[] = selected.tasks.map((task, idx) => ({
      ...task,
      id: `task-voice-${Date.now()}-${idx}`,
    }));

    const newBirthdaysList: BirthdayEvent[] = selected.birthdays.map((bday, idx) => ({
      ...bday,
      id: `bday-voice-${Date.now()}-${idx}`,
    }));

    if (newSchedule.length > 0) updateSchedule([...schedule, ...newSchedule]);
    if (newTasksList.length > 0) updateTasks([...newTasksList, ...tasks]);
    if (newBirthdaysList.length > 0) updateBirthdays([...birthdays, ...newBirthdaysList]);

    const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const summaryMsg: ChatMessage = {
      id: `msg-voice-${Date.now()}`,
      sender: 'assistant',
      text: `⚡️ <b>Voice Brain успешно обработал голосовой поток:</b>\n\n«${extractedVoiceData?.rawTranscript}»\n\n✅ Добавлено: ${newSchedule.length} пар/встреч, ${newTasksList.length} задач, ${newBirthdaysList.length} событий.`,
      timestamp: nowTime,
      suggestions: ['⚡️ Пересчитай план дня', '🎓 Покажи расписание'],
    };
    updateChat([...chat, summaryMsg]);
  };

  // Отправка сообщений в AI чат
  const handleSendMessage = (text: string) => {
    const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: nowTime,
    };

    const parsed = aiPlanner.parseUserIntent(text);

    if (parsed.action === 'optimize_day') {
      setTimeout(() => {
        handleOpenOptimizer();
      }, 500);
    } else if (parsed.action === 'add_schedule' && parsed.data) {
      handleAddSchedule({
        title: parsed.data.title,
        type: 'lecture',
        startTime: parsed.data.startTime || '12:00',
        endTime: '13:30',
        location: parsed.data.location || 'Ауд. 201',
        dayOfWeek: 1,
      });
    } else if (parsed.action === 'add_task' && parsed.data) {
      handleAddTask({
        title: parsed.data.title,
        category: 'study',
        priority: 'high',
        timeEstimateMin: 30,
        completed: false,
        date: new Date().toISOString().split('T')[0],
      });
    } else if (parsed.action === 'show_schedule') {
      setActiveTab('schedule');
    } else if (parsed.action === 'show_birthdays') {
      setActiveTab('birthdays');
    }

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      sender: 'assistant',
      text: parsed.reply,
      timestamp: nowTime,
      suggestions: parsed.suggestions,
    };

    updateChat([...chat, userMessage, assistantMessage]);
  };

  const analysis = aiPlanner.analyzeDay(schedule, tasks);
  const activeTasksCount = tasks.filter(t => !t.completed).length;

  const voiceBrainCheck = starsPayment.canUseVoiceBrain();

  return (
    <div className="app-container">
      {/* Шапка */}
      {activeTab !== 'chat' && (
        <Header 
          analysis={analysis}
          activeTasksCount={activeTasksCount}
          scheduleCount={schedule.length}
          isPro={subscription.isPro}
          onOpenOptimizer={handleOpenOptimizer}
          onOpenSettings={() => setShowSettings(true)}
          onOpenPaywall={() => setShowPaywall(true)}
          onOpenAdmin={() => setShowAdminModal(true)}
        />
      )}

      {/* Контент активной вкладки */}
      <main style={{ flex: 1, paddingTop: activeTab === 'chat' ? 14 : 0 }}>
        {activeTab === 'day' && (
          <DayTab 
            schedule={schedule}
            tasks={tasks}
            birthdays={birthdays}
            analysis={analysis}
            onToggleTask={handleToggleTask}
            onNavigateTab={setActiveTab}
            onOpenOptimizer={handleOpenOptimizer}
          />
        )}

        {activeTab === 'schedule' && (
          <ScheduleTab 
            schedule={schedule}
            onAddSchedule={handleAddSchedule}
            onDeleteSchedule={handleDeleteSchedule}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksTab 
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === 'birthdays' && (
          <BirthdaysTab 
            birthdays={birthdays}
            onAddBirthday={handleAddBirthday}
            onDeleteBirthday={handleDeleteBirthday}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab 
            chat={chat}
            schedule={schedule}
            tasks={tasks}
            birthdays={birthdays}
            onSendMessage={handleSendMessage}
            onOpenOptimizer={handleOpenOptimizer}
            onAddTask={handleAddTask}
            onAddSchedule={handleAddSchedule}
            onOpenVoiceRecorder={handleOpenVoiceBrain}
          />
        )}
      </main>

      {/* Плавающая кнопка микрофона Voice Brain AI */}
      {activeTab !== 'chat' && !showVoiceRecorder && !showVoiceConfirmation && !showPaywall && !showAdminModal && (
        <VoiceFloatingButton 
          isPro={subscription.isPro}
          remainingRequests={voiceBrainCheck.remaining}
          onClick={handleOpenVoiceBrain}
        />
      )}

      {/* Нижняя навигация */}
      <BottomNav 
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeTasksCount={activeTasksCount}
        scheduleCount={schedule.length}
      />

      {/* Модалка оптимизатора дня */}
      {showOptimizer && (
        <DayPlannerModal 
          slots={dayPlanSlots}
          analysis={analysis}
          onClose={() => setShowOptimizer(false)}
        />
      )}

      {/* Модалка настроек уведомлений */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClearAll={handleClearAll}
          onBackup={() => notificationService.sendBackupToBot(settings, schedule, tasks, birthdays)}
          onOpenAdmin={() => setShowAdminModal(true)}
          onRefreshSubscription={() => setSubscription(starsPayment.getSubscription())}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Модалка записи звука Voice Brain */}
      {showVoiceRecorder && (
        <VoiceRecorderModal 
          onTranscriptComplete={handleVoiceTranscriptComplete}
          onClose={() => setShowVoiceRecorder(false)}
        />
      )}

      {/* Модалка подтверждения распознанных сущностей */}
      {showVoiceConfirmation && extractedVoiceData && (
        <VoiceBrainConfirmationModal 
          data={extractedVoiceData}
          onApply={handleApplyVoiceData}
          onClose={() => setShowVoiceConfirmation(false)}
        />
      )}

      {/* Модалка пейволла Telegram Stars */}
      {showPaywall && (
        <PaywallModal 
          remainingRequests={voiceBrainCheck.remaining}
          onSuccess={() => setSubscription(starsPayment.getSubscription())}
          onClose={() => setShowPaywall(false)}
        />
      )}

      {/* Модалка Админ-панели (Dev VIP) */}
      {showAdminModal && (
        <AdminModal 
          isPro={subscription.isPro}
          onRefreshSubscription={() => setSubscription(starsPayment.getSubscription())}
          onClose={() => setShowAdminModal(false)}
        />
      )}
    </div>
  );
};

export default App;
