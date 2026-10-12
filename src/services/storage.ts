import { Task, ScheduleItem, BirthdayEvent, ChatMessage } from '../types';

const STORAGE_KEYS = {
  TASKS: 'smart_planner_tasks',
  SCHEDULE: 'smart_planner_schedule',
  BIRTHDAYS: 'smart_planner_birthdays',
  CHAT: 'smart_planner_chat',
};

// Сегодняшняя дата для дефолтных данных
const todayStr = new Date().toISOString().split('T')[0];

const INITIAL_SCHEDULE: ScheduleItem[] = [
  {
    id: 'sch-1',
    title: 'Высшая математика',
    type: 'lecture',
    startTime: '09:00',
    endTime: '10:30',
    location: 'Ауд. 402 (Главный корпус)',
    teacherOrHost: 'проф. Иванов А.В.',
    dayOfWeek: 1, // Понедельник
    notes: 'Повторить интегралы и ряды Тейлора',
  },
  {
    id: 'sch-2',
    title: 'Архитектура программных систем',
    type: 'lab',
    startTime: '10:50',
    endTime: '12:20',
    location: 'Лаборатория 218',
    teacherOrHost: 'доц. Смирнов Д.К.',
    dayOfWeek: 1,
    notes: 'Сдача 2-й лабораторной по микросервисам',
  },
  {
    id: 'sch-3',
    title: 'Синхронизация по проекту',
    type: 'meeting',
    startTime: '14:30',
    endTime: '15:15',
    location: 'Telegram звонок / Zoom',
    teacherOrHost: 'Команда разработки',
    dayOfWeek: 1,
    notes: 'Обсудить Telegram Mini App и фичи органайзера',
  },
  {
    id: 'sch-4',
    title: 'Английский для IT',
    type: 'practice',
    startTime: '16:00',
    endTime: '17:30',
    location: 'Ауд. 108',
    teacherOrHost: 'Кузнецова Е.М.',
    dayOfWeek: 1,
    notes: 'Презентация своего pet-проекта',
  },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Загрузить отчет по лабораторной №2',
    category: 'study',
    priority: 'high',
    timeEstimateMin: 25,
    completed: false,
    dueTime: '13:00',
    date: todayStr,
  },
  {
    id: 'task-2',
    title: 'Выбрать подарок на ДР Артёму',
    category: 'personal',
    priority: 'high',
    timeEstimateMin: 30,
    completed: false,
    dueTime: '18:00',
    date: todayStr,
  },
  {
    id: 'task-3',
    title: 'Проверить конспекты по матану перед парой',
    category: 'study',
    priority: 'medium',
    timeEstimateMin: 20,
    completed: true,
    dueTime: '08:40',
    date: todayStr,
  },
  {
    id: 'task-4',
    title: 'Разобрать рабочую почту и чаты',
    category: 'work',
    priority: 'low',
    timeEstimateMin: 15,
    completed: false,
    dueTime: '19:30',
    date: todayStr,
  },
];

const INITIAL_BIRTHDAYS: BirthdayEvent[] = [
  {
    id: 'bday-1',
    name: 'Артём Соколов',
    relationship: 'friend',
    birthDate: '10-15', // Через несколько дней
    age: 21,
    giftIdeas: ['Механическая клавиатура', 'Сертификат Steam', 'Кружка с принтом'],
    notes: 'Отмечает в субботу в лофте, скинуться с ребятами',
    avatarColor: '#6366f1',
  },
  {
    id: 'bday-2',
    name: 'Мама ❤️',
    relationship: 'family',
    birthDate: '10-24',
    giftIdeas: ['Цветы (пионы/гортензии)', 'Умные часы', 'Билеты в театр'],
    notes: 'Позвонить обязательно с утра!',
    avatarColor: '#ec4899',
  },
  {
    id: 'bday-3',
    name: 'Даша (староста)',
    relationship: 'classmate',
    birthDate: '11-04',
    giftIdeas: ['Ежедневник Moleskine', 'Кофе премиум'],
    notes: 'Купить открытку от группы',
    avatarColor: '#10b981',
  },
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'assistant',
    text: 'Привет! Я твой персональный ассистент и органайзер ⚡️\n\nЯ слежу за твоими парами, дедлайнами, днями рождения и помогу сбалансировать день, чтобы ты всё успел без стресса. Чем помочь прямо сейчас?',
    timestamp: '09:00',
    suggestions: [
      '⚡️ Распиши мой день по минутам',
      '🎓 Какие сегодня пары?',
      '🎂 У кого скоро ДР?',
      'Добавь задачу: сделать курсач',
    ],
  },
];

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
};
