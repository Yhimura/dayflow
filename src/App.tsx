import React, { useState, useEffect } from 'react';
import { storage } from './services/storage';
import { aiPlanner } from './services/aiPlanner';
import { tg } from './services/telegram';
import { Task, ScheduleItem, BirthdayEvent, ChatMessage, DayPlanSlot } from './types';
import { Header } from './components/Header';
import { DayTab } from './components/DayTab';
import { ScheduleTab } from './components/ScheduleTab';
import { TasksTab } from './components/TasksTab';
import { BirthdaysTab } from './components/BirthdaysTab';
import { ChatTab } from './components/ChatTab';
import { BottomNav, TabType } from './components/BottomNav';
import { DayPlannerModal } from './components/DayPlannerModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('day');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [birthdays, setBirthdays] = useState<BirthdayEvent[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);

  // Состояние модалки оптимизатора дня
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [dayPlanSlots, setDayPlanSlots] = useState<DayPlanSlot[]>([]);

  // Загрузка начальных данных и инициализация Telegram
  useEffect(() => {
    tg.init();
    setTasks(storage.getTasks());
    setSchedule(storage.getSchedule());
    setBirthdays(storage.getBirthdays());
    setChat(storage.getChat());
  }, []);

  // Синхронизация в localStorage при изменении
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

    // Автоматические действия на основе интента
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

  // Анализ текущего дня
  const analysis = aiPlanner.analyzeDay(schedule, tasks);
  const activeTasksCount = tasks.filter(t => !t.completed).length;

  return (
    <div className="app-container">
      {/* Шапка отображается на всех вкладках, кроме чата для максимума пространства */}
      {activeTab !== 'chat' && (
        <Header 
          analysis={analysis}
          activeTasksCount={activeTasksCount}
          scheduleCount={schedule.length}
          onOpenOptimizer={handleOpenOptimizer}
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
          />
        )}
      </main>

      {/* Нижняя навигация */}
      <BottomNav 
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        activeTasksCount={activeTasksCount}
        scheduleCount={schedule.length}
      />

      {/* Модальное окно оптимизатора дня */}
      {showOptimizer && (
        <DayPlannerModal 
          slots={dayPlanSlots}
          analysis={analysis}
          onClose={() => setShowOptimizer(false)}
        />
      )}
    </div>
  );
};

export default App;
