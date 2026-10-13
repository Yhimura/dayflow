export type Priority = 'high' | 'medium' | 'low';
export type TaskCategory = 'study' | 'work' | 'personal' | 'urgent';

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  priority: Priority;
  timeEstimateMin: number;
  completed: boolean;
  dueTime?: string; // e.g. "16:30"
  date: string; // YYYY-MM-DD
}

export type ScheduleType = 'lecture' | 'practice' | 'lab' | 'meeting' | 'call';

export interface ScheduleItem {
  id: string;
  title: string;
  type: ScheduleType;
  startTime: string; // "09:00"
  endTime: string;   // "10:30"
  location: string;  // "Ауд. 412" or "Zoom"
  teacherOrHost?: string;
  dayOfWeek: number; // 1 = Пн, 7 = Вс (или конкретная дата)
  date?: string;     // YYYY-MM-DD
  notes?: string;
}

export type RelationshipType = 'friend' | 'family' | 'colleague' | 'classmate';

export interface BirthdayEvent {
  id: string;
  name: string;
  relationship: RelationshipType;
  birthDate: string; // "MM-DD" or "YYYY-MM-DD"
  age?: number;
  giftIdeas: string[];
  notes?: string;
  avatarColor: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  suggestions?: string[];
  actionType?: 'task_added' | 'schedule_added' | 'birthday_added' | 'plan_generated' | 'balance_alert';
  payload?: any;
}

export interface DayPlanSlot {
  time: string;
  title: string;
  type: 'schedule' | 'task' | 'break' | 'commute';
  durationMin: number;
  isImportant?: boolean;
}

export interface DayAnalysis {
  totalOccupiedMin: number;
  studyMin: number;
  freeMin: number;
  stressScore: number; // 0 - 100
  verdict: 'relaxed' | 'optimal' | 'busy' | 'overloaded';
  recommendations: string[];
}

export interface NotificationSettings {
  botToken: string;
  proxyUrl?: string; // Безопасный серверный шлюз (Cloudflare Worker / Vercel API)
  chatId: string;
  enableTelegramNotify: boolean;
  classRemindMinutes: number; // e.g. 15
  taskRemindMinutes: number;  // e.g. 30
  birthdayRemindDays: number; // e.g. 1
  morningSummaryEnabled: boolean;
  morningSummaryTime: string; // "08:30"
}

// ==========================================
// 🚀 VOICE BRAIN AI & TELEGRAM STARS TYPES
// ==========================================

export interface ExtractedVoiceData {
  rawTranscript: string;
  summary: string;
  scheduleItems: Omit<ScheduleItem, 'id'>[];
  tasks: Omit<Task, 'id'>[];
  birthdays: Omit<BirthdayEvent, 'id'>[];
}

export interface UserSubscription {
  isPro: boolean;
  proExpiresAt?: string; // ISO string
  freeVoiceRequestsUsed: number;
  freeVoiceRequestsLimit: number; // 5 по умолчанию
  bonusRequests: number; // купленные разово запросы
  weekResetDate: string; // ISO string даты сброса (понедельник недели)
}

export interface StarsTariff {
  id: string;
  title: string;
  starsAmount: number;
  description: string;
  badge?: string;
  type: 'subscription' | 'package';
  bonusRequests?: number;
  durationDays?: number;
}
