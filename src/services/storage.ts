import { Task, ScheduleItem, BirthdayEvent, ChatMessage, NotificationSettings } from '../types';
import { tg } from './telegram';
import { DEFAULT_BOT_TOKEN } from './notificationService';

const STORAGE_KEYS = {
  TASKS: 'dayflow_tasks_v3',
  SCHEDULE: 'dayflow_schedule_v3',
  BIRTHDAYS: 'dayflow_birthdays_v3',
  CHAT: 'dayflow_chat_v3',
  SETTINGS: 'dayflow_settings_v3',
  VERSION: 'dayflow_version_v3_clean',
};

// Принудительная очистка старых данных при первом запуске новой версии
if (typeof window !== 'undefined') {
  if (localStorage.getItem(STORAGE_KEYS.VERSION) !== 'clean_v3') {
    // Удаляем старые демо-данные из первой версии
    localStorage.removeItem('smart_planner_tasks');
    localStorage.removeItem('smart_planner_schedule');
    localStorage.removeItem('smart_planner_birthdays');
    localStorage.removeItem('smart_planner_chat');
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
    localStorage.removeItem(STORAGE_KEYS.BIRTHDAYS);
    localStorage.removeItem(STORAGE_KEYS.CHAT);
    localStorage.setItem(STORAGE_KEYS.VERSION, 'clean_v3');
  }
}

// Пустые начальные списки
const INITIAL_SCHEDULE: ScheduleItem[] = [];
const INITIAL_TASKS: Task[] = [];
const INITIAL_BIRTHDAYS: BirthdayEvent[] = [];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: 'Привет! Я твой персональный органайзер DayFlow ⚡️\n\nТвой планер чист и готов к работе:\n• Добавляй пары во вкладке «Пары»\n• Записывай задачи в «Дела»\n• Сохраняй дни рождения в «Дни рожд.»\n\n💬 Или просто напиши мне сюда в чат человеческим языком: например, «добавь пару по физике в 14:00» или «напомни сделать отчет».\n\n⚙️ В правом верхнем углу нажми на шестеренку, чтобы настроить напоминания через нашего Telegram-бота!',
    timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    suggestions: [
      '🎓 Добавь пару: Физика в 10:00',
      '📌 Напомни: сделать курсач',
      '🎂 У друга ДР 20 октября',
      '⚡️ Распиши план на день',
    ],
  },
];

const DEFAULT_SETTINGS: NotificationSettings = {
  botToken: DEFAULT_BOT_TOKEN,
  proxyUrl: '',
  chatId: '',
  enableTelegramNotify: true,
  classRemindMinutes: 15,
  taskRemindMinutes: 30,
  birthdayRemindDays: 1,
  morningSummaryEnabled: true,
  morningSummaryTime: '08:30',
};

export const storage = {
  getTasks(): Task[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TASKS;
    }
  },

  saveTasks(tasks: Task[]) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  getSchedule(): ScheduleItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULE);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(INITIAL_SCHEDULE));
      return INITIAL_SCHEDULE;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SCHEDULE;
    }
  },

  saveSchedule(schedule: ScheduleItem[]) {
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  },

  getBirthdays(): BirthdayEvent[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BIRTHDAYS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BIRTHDAYS, JSON.stringify(INITIAL_BIRTHDAYS));
      return INITIAL_BIRTHDAYS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_BIRTHDAYS;
    }
  },

  saveBirthdays(birthdays: BirthdayEvent[]) {
    localStorage.setItem(STORAGE_KEYS.BIRTHDAYS, JSON.stringify(birthdays));
  },

  getChat(): ChatMessage[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHAT);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(INITIAL_CHAT));
      return INITIAL_CHAT;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CHAT;
    }
  },

  saveChat(messages: ChatMessage[]) {
    localStorage.setItem(STORAGE_KEYS.CHAT, JSON.stringify(messages));
  },

  getSettings(): NotificationSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const user = tg.getUser();
    const fallbackChatId = user?.id ? String(user.id) : '';

    if (!raw) {
      const init = { ...DEFAULT_SETTINGS, chatId: fallbackChatId };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(init));
      return init;
    }
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.chatId && fallbackChatId) {
        parsed.chatId = fallbackChatId;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: NotificationSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.SCHEDULE);
    localStorage.removeItem(STORAGE_KEYS.BIRTHDAYS);
    localStorage.removeItem(STORAGE_KEYS.CHAT);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BIRTHDAYS, JSON.stringify([]));
  }
};
