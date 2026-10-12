import { ScheduleItem, Task, BirthdayEvent, ExtractedVoiceData, ScheduleType, Priority, TaskCategory, RelationshipType } from '../types';

export class VoiceBrainParserService {
  /**
   * Разбор произвольного речевого потока мыслей на структурированные сущности
   */
  public parseTranscript(transcript: string): ExtractedVoiceData {
    const text = transcript.trim();
    if (!text) {
      return {
        rawTranscript: '',
        summary: 'Голосовой ввод пуст.',
        scheduleItems: [],
        tasks: [],
        birthdays: [],
      };
    }

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Разобьем поток мыслей на фразы по разделителям (знаки препинания, союзы "потом", "а еще", "также", "и затем")
    const segments = this.splitIntoSegments(text);

    const scheduleItems: Omit<ScheduleItem, 'id'>[] = [];
    const tasks: Omit<Task, 'id'>[] = [];
    const birthdays: Omit<BirthdayEvent, 'id'>[] = [];

    // Цвета для аватаров ДР
    const avatarColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

    for (const segment of segments) {
      const lower = segment.toLowerCase();

      // 1. Проверяем, относится ли сегмент к Дню Рождения
      if (this.isBirthdaySegment(lower)) {
        const birthday = this.extractBirthday(segment, lower, avatarColors);
        if (birthday) {
          birthdays.push(birthday);
          continue;
        }
      }

      // 2. Проверяем, относится ли сегмент к паре, лекции или встрече со временем
      if (this.isScheduleSegment(lower)) {
        const scheduleItem = this.extractSchedule(segment, lower, today);
        if (scheduleItem) {
          scheduleItems.push(scheduleItem);
          continue;
        }
      }

      // 3. Во всех остальных случаях или при наличии маркеров задач создаем задачу
      const task = this.extractTask(segment, lower, todayStr);
      if (task) {
        tasks.push(task);
      }
    }

    // Если ничего конкретного не распозналось, но текст есть — создаем одну задачу из всего текста
    if (scheduleItems.length === 0 && tasks.length === 0 && birthdays.length === 0 && text.length > 3) {
      tasks.push({
        title: this.capitalize(text),
        category: 'personal',
        priority: 'medium',
        timeEstimateMin: 30,
        completed: false,
        date: todayStr,
      });
    }

    // Формируем понятную сводку (summary)
    const counts: string[] = [];
    if (scheduleItems.length > 0) counts.push(`${scheduleItems.length} ${this.pluralize(scheduleItems.length, 'встреча/пара', 'встречи/пары', 'встреч/пар')}`);
    if (tasks.length > 0) counts.push(`${tasks.length} ${this.pluralize(tasks.length, 'дело', 'дела', 'дел')}`);
    if (birthdays.length > 0) counts.push(`${birthdays.length} ${this.pluralize(birthdays.length, 'день рождения', 'дня рождения', 'дней рождения')}`);

    const summary = counts.length > 0
      ? `Найдено: ${counts.join(', ')}`
      : 'Распознано действие для органайзера';

    return {
      rawTranscript: text,
      summary,
      scheduleItems,
      tasks,
      birthdays,
    };
  }

  // Разбиение на смысловые сегменты
  private splitIntoSegments(text: string): string[] {
    const normalized = text
      .replace(/\s+(потом|затем|а также|а еще|после этого)\s+/gi, '. ')
      .replace(/[,;]\s*(и\s+напомни|и\s+еще|и\s+купить|и\s+сделать)/gi, '. $1');

    return normalized
      .split(/[.!?\n]+/)
      .map(s => s.trim())
      .filter(s => s.length > 4);
  }

  // Проверка признака Дня Рождения
  private isBirthdaySegment(lower: string): boolean {
    return lower.includes('день рождения') || lower.includes('дня рождения') || 
           lower.includes('др ') || lower.endsWith('др') || lower.includes('подарок');
  }

  // Извлечение события Дня Рождения
  private extractBirthday(raw: string, lower: string, colors: string[]): Omit<BirthdayEvent, 'id'> | null {
    let name = 'Близкий человек';
    let relationship: RelationshipType = 'friend';

    if (lower.includes('маме') || lower.includes('мама') || lower.includes('мамы')) {
      name = 'Мама ❤️';
      relationship = 'family';
    } else if (lower.includes('папе') || lower.includes('папа')) {
      name = 'Папа';
      relationship = 'family';
    } else if (lower.includes('сестре') || lower.includes('сестра')) {
      name = 'Сестра';
      relationship = 'family';
    } else if (lower.includes('брату') || lower.includes('брат')) {
      name = 'Брат';
      relationship = 'family';
    } else {
      // Ищем имя: например "у Артёма", "у Максима", "у Саши"
      const nameMatch = raw.match(/у\s+([А-Яа-яЁёA-Za-z]+)/i);
      if (nameMatch) {
        name = this.capitalize(nameMatch[1]);
      }
    }

    // Ищем подарок
    const giftIdeas: string[] = [];
    const giftMatch = raw.match(/подарить\s+([^,.]+)|подарок\s+([^,.]+)/i);
    if (giftMatch) {
      const gift = (giftMatch[1] || giftMatch[2]).trim();
      if (gift) giftIdeas.push(this.capitalize(gift));
    }

    // Ищем дату (например "15 октября" или "25 мая")
    const dateMatch = lower.match(/(\d{1,2})\s+(январ[яе]|феврал[яе]|март[ае]|апрел[яе]|ма[яе]|июн[яе]|июл[яе]|август[ае]|сентябр[яе]|октябр[яе]|ноябр[яе]|декабр[яе])/i);
    let birthDate = '10-25'; // дефолт
    if (dateMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const monthMap: Record<string, string> = {
        янв: '01', фев: '02', мар: '03', апр: '04', май: '05', мая: '05',
        июн: '06', июл: '07', авг: '08', сен: '09', окт: '10', ноя: '11', дек: '12',
      };
      const monthPrefix = dateMatch[2].substring(0, 3).toLowerCase();
      const month = monthMap[monthPrefix] || '10';
      birthDate = `${month}-${day}`;
    }

    return {
      name,
      relationship,
      birthDate,
      giftIdeas: giftIdeas.length > 0 ? giftIdeas : ['Выбрать подарок'],
      notes: `Создано голосовым ассистентом из: «${raw}»`,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  // Проверка признака пары/встречи
  private isScheduleSegment(lower: string): boolean {
    const hasTime = /\b\d{1,2}[:.]\d{2}\b|\b\d{1,2}\s+(утра|дня|вечера|часов|ночи)\b/i.test(lower);
    const hasEventWord = lower.includes('пара') || lower.includes('лекци') || 
                         lower.includes('практик') || lower.includes('созвон') || 
                         lower.includes('встреч') || lower.includes('семинар') || 
                         lower.includes('лабораторн') || lower.includes('ауд');

    return hasTime || hasEventWord;
  }

  // Извлечение события расписания
  private extractSchedule(raw: string, lower: string, today: Date): Omit<ScheduleItem, 'id'> | null {
    // 1. Извлекаем время начала
    let startTime = '10:00';
    let endTime = '11:30';

    const timeExplicit = raw.match(/(\d{1,2})[:.](\d{2})/);
    if (timeExplicit) {
      const h = timeExplicit[1].padStart(2, '0');
      const m = timeExplicit[2];
      startTime = `${h}:${m}`;
      const endH = String((Number(h) + 1) % 24).padStart(2, '0');
      endTime = `${endH}:${m}`;
    } else {
      const timeWords = raw.match(/в\s+(\d{1,2})\s*(утра|дня|вечера|часов)?/i);
      if (timeWords) {
        let h = Number(timeWords[1]);
        if (timeWords[2]?.toLowerCase() === 'вечера' && h < 12) h += 12;
        startTime = `${String(h).padStart(2, '0')}:00`;
        endTime = `${String((h + 1) % 24).padStart(2, '0')}:30`;
      }
    }

    // 2. Тип события
    let type: ScheduleType = 'meeting';
    if (lower.includes('лекци')) type = 'lecture';
    else if (lower.includes('лаб')) type = 'lab';
    else if (lower.includes('практик')) type = 'practice';
    else if (lower.includes('созвон') || lower.includes('zoom') || lower.includes('зум')) type = 'call';

    // 3. Локация / аудитория
    let location = 'Главный корпус';
    if (lower.includes('zoom') || lower.includes('зум') || lower.includes('дистант') || lower.includes('онлайн')) {
      location = 'Zoom / Онлайн';
    } else {
      const roomMatch = raw.match(/(\d{3,4}\s*(ауд|каб)?|[a-zа-я0-9-]+\s*(ауд|каб))/i);
      if (roomMatch) {
        location = `Ауд. ${roomMatch[0].replace(/ауд|каб/gi, '').trim()}`;
      }
    }

    // 4. Определение дня недели
    let dayOfWeek = today.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7; // Вс = 7

    if (lower.includes('завтра')) {
      dayOfWeek = (dayOfWeek % 7) + 1;
    } else if (lower.includes('понедельник')) dayOfWeek = 1;
    else if (lower.includes('вторник')) dayOfWeek = 2;
    else if (lower.includes('сред')) dayOfWeek = 3;
    else if (lower.includes('четверг')) dayOfWeek = 4;
    else if (lower.includes('пятниц')) dayOfWeek = 5;
    else if (lower.includes('суббот')) dayOfWeek = 6;

    // 5. Очищенное название
    const cleanTitle = raw
      .replace(/завтра|сегодня|в\s+\d{1,2}[:.]\d{2}|в\s+\d{1,2}\s*(утра|дня|вечера|часов)?/gi, '')
      .replace(/пара\s+по|пара|лекция\s+по|лекция|встреча\s+с|встреча|созвон\s+с|созвон/gi, '')
      .replace(/в\s+\d{3,4}\s*(ауд|каб)?/gi, '')
      .replace(/в\s+зуме|в\s+zoom/gi, '')
      .trim();

    return {
      title: cleanTitle ? this.capitalize(cleanTitle) : 'Занятие / Встреча',
      type,
      startTime,
      endTime,
      location,
      dayOfWeek,
      notes: `Голосовая заметка: ${raw}`,
    };
  }

  // Извлечение задачи
  private extractTask(raw: string, lower: string, todayStr: string): Omit<Task, 'id'> | null {
    // Приоритет
    let priority: Priority = 'medium';
    if (lower.includes('срочно') || lower.includes('обязательно') || lower.includes('горят') || lower.includes('дедлайн')) {
      priority = 'high';
    } else if (lower.includes('когда будет время') || lower.includes('не к спеху') || lower.includes('потом')) {
      priority = 'low';
    }

    // Категория
    let category: TaskCategory = 'personal';
    if (lower.includes('дз') || lower.includes('домашк') || lower.includes('реферат') || 
        lower.includes('курсач') || lower.includes('лабу') || lower.includes('учеб') || lower.includes('сесси')) {
      category = 'study';
    } else if (lower.includes('работ') || lower.includes('отчет') || lower.includes('клиент') || lower.includes('проект')) {
      category = 'work';
    } else if (priority === 'high') {
      category = 'urgent';
    }

    // Дедлайн по времени
    let dueTime: string | undefined = undefined;
    const dueMatch = raw.match(/до\s+(\d{1,2}[:.]\d{2})|к\s+(\d{1,2}[:.]\d{2})/i);
    if (dueMatch) {
      dueTime = (dueMatch[1] || dueMatch[2]).replace('.', ':');
    } else if (lower.includes('вечером')) {
      dueTime = '20:00';
    }

    // Оценка времени
    let timeEstimateMin = 30;
    if (lower.includes('быстро') || lower.includes('5 минут')) timeEstimateMin = 15;
    else if (lower.includes('курсач') || lower.includes('диплом') || lower.includes('реферат')) timeEstimateMin = 60;

    // Очистка названия задачи
    let title = raw
      .replace(/напомни|нужно|надо|сделать|купить|подготовить|срочно/gi, '')
      .replace(/к\s+четвергу|к\s+пятнице|к\s+вечеру|до\s+\d{1,2}[:.]\d{2}/gi, '')
      .trim();

    if (!title) title = raw;

    return {
      title: this.capitalize(title),
      category,
      priority,
      timeEstimateMin,
      completed: false,
      dueTime,
      date: todayStr,
    };
  }

  private capitalize(s: string): string {
    if (!s) return '';
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private pluralize(count: number, one: string, two: string, five: string): string {
    const n = Math.abs(count) % 100;
    const n1 = n % 10;
    if (n > 10 && n < 20) return five;
    if (n1 > 1 && n1 < 5) return two;
    if (n1 === 1) return one;
    return five;
  }
}

export const voiceBrainParser = new VoiceBrainParserService();
