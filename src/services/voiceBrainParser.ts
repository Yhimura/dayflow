import { 
  ScheduleItem, Task, BirthdayEvent, ExtractedVoiceData, 
  ScheduleType, Priority, TaskCategory, RelationshipType 
} from '../types';

export class VoiceBrainParserService {
  /**
   * Разбор произвольного речевого потока мыслей на структурированные сущности:
   * задачи (Tasks), пары/встречи (ScheduleItems) и дни рождения (Birthdays).
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

    // 1. Интеллектуальное разбиение потока мыслей на смысловые сегменты
    const segments = this.splitIntoThoughtSegments(text);

    const scheduleItems: Omit<ScheduleItem, 'id'>[] = [];
    const tasks: Omit<Task, 'id'>[] = [];
    const birthdays: Omit<BirthdayEvent, 'id'>[] = [];

    const avatarColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

    for (const segment of segments) {
      const lower = segment.toLowerCase();

      // А: Проверяем, относится ли сегмент к Дню Рождения / поздравлению
      if (this.isBirthdaySegment(lower)) {
        const birthday = this.extractBirthday(segment, lower, avatarColors, today);
        if (birthday) {
          birthdays.push(birthday);
          continue;
        }
      }

      // Б: Проверяем, относится ли сегмент к паре, лекции или официальной встрече
      if (this.isScheduleSegment(lower)) {
        const scheduleItem = this.extractSchedule(segment, lower, today);
        if (scheduleItem) {
          scheduleItems.push(scheduleItem);
          continue;
        }
      }

      // В: Во всех остальных случаях создаем задачу (Task) с очищенным названием
      const task = this.extractTask(segment, lower, todayStr);
      if (task) {
        tasks.push(task);
      }
    }

    // Если ничего не распозналось, но текст есть — создаем базовую задачу
    if (scheduleItems.length === 0 && tasks.length === 0 && birthdays.length === 0 && text.length > 3) {
      tasks.push({
        title: this.cleanAndCapitalize(text),
        category: 'personal',
        priority: 'medium',
        timeEstimateMin: 30,
        completed: false,
        date: todayStr,
      });
    }

    // Формируем сводку для интерфейса
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

  /**
   * Токенизированное разбиение сплошной русской речи без знаков препинания на отдельные мысли.
   * Безопасно для кириллицы (не использует нестабильный \b для русских букв).
   */
  private splitIntoThoughtSegments(text: string): string[] {
    // Сначала разделяем по явным знакам препинания, если они есть
    const initialChunks = text.split(/[.!?\n;]+/).map(s => s.trim()).filter(s => s.length > 0);
    const finalSegments: string[] = [];

    // Слова-связки перехода к следующему действию
    const transitionStarters = new Set([
      'после', 'потом', 'затем', 'дальше', 'далее', 'также', 'плюс', 'вслед'
    ]);

    // Модальные слова необходимости
    const modalStarters = new Set([
      'надо', 'нужно', 'необходимо', 'придется', 'напомни', 'не забудь'
    ]);

    // Инфинитивы глаголов действий, начинающие новые задачи
    const actionVerbs = new Set([
      'позвонить', 'набрать', 'созвониться', 'написать',
      'приготовить', 'сварить', 'испечь', 'поесть',
      'убраться', 'прибраться', 'помыть', 'постирать', 'пропылесосить',
      'купить', 'заказать', 'забрать', 'заехать', 'сходить', 'поехать',
      'поздравить', 'встретиться', 'сдать', 'оплатить', 'отправить', 'проверить', 'сделать'
    ]);

    for (const chunk of initialChunks) {
      const words = chunk.split(/\s+/).filter(w => w.length > 0);
      let currentWords: string[] = [];

      for (let i = 0; i < words.length; i++) {
        const rawWord = words[i];
        const cleanWord = rawWord.toLowerCase().replace(/[^а-яёa-z0-9]/gi, '');
        const prevClean = currentWords.length > 0 
          ? currentWords[currentWords.length - 1].toLowerCase().replace(/[^а-яёa-z0-9]/gi, '') 
          : '';

        let isBoundary = false;

        // 1. Переходные связки ("после...", "потом...", "затем...")
        if (transitionStarters.has(cleanWord) && currentWords.length >= 2) {
          isBoundary = true;
        } 
        // 2. Модальные слова ("надо...", "нужно..."), если перед ними уже есть законченная фраза
        else if (modalStarters.has(cleanWord) && currentWords.length >= 3) {
          if (!['и', 'а', 'после', 'потом', 'затем', 'мне'].includes(prevClean)) {
            isBoundary = true;
          }
        } 
        // 3. Глаголы действий, не соединенные союзом "и" ("ужин позвонить Вике...")
        else if (actionVerbs.has(cleanWord) && currentWords.length >= 3) {
          if (!['и', 'да', 'чтобы', 'или', 'не', 'надо', 'нужно', 'будет', 'должна', 'должен', 'хочу'].includes(prevClean)) {
            isBoundary = true;
          }
        } 
        // 4. Поздравление ("...поздравить его с днем рождения")
        else if (cleanWord === 'поздравить' && currentWords.length >= 2) {
          isBoundary = true;
        }

        if (isBoundary) {
          finalSegments.push(currentWords.join(' '));
          currentWords = [];
        }

        currentWords.push(rawWord);
      }

      if (currentWords.length > 0) {
        finalSegments.push(currentWords.join(' '));
      }
    }

    return finalSegments
      .map(s => s.trim())
      .filter(s => s.length > 3);
  }

  /**
   * Проверка: является ли сегмент событием Дня Рождения
   */
  private isBirthdaySegment(lower: string): boolean {
    return lower.includes('днем рождения') || 
           lower.includes('днём рождения') || 
           lower.includes('день рождения') || 
           lower.includes('дня рождения') || 
           lower.includes('др у') || 
           lower.includes('поздравить');
  }

  /**
   * Извлечение Дня Рождения с расчетом даты и имени
   */
  private extractBirthday(raw: string, lower: string, colors: string[], today: Date): Omit<BirthdayEvent, 'id'> | null {
    let name = 'Близкий человек';
    let relationship: RelationshipType = 'friend';

    if (lower.includes('мам')) {
      name = 'Мама ❤️';
      relationship = 'family';
    } else if (lower.includes('пап')) {
      name = 'Папа';
      relationship = 'family';
    } else if (lower.includes('сестр')) {
      name = 'Сестра';
      relationship = 'family';
    } else if (lower.includes('брат')) {
      name = 'Брат';
      relationship = 'family';
    } else if (lower.includes('бабушк')) {
      name = 'Бабушка';
      relationship = 'family';
    } else if (lower.includes('дедушк')) {
      name = 'Дедушка';
      relationship = 'family';
    } else {
      // Поиск имени (например "у Артема", "у Вики", "Вику", "поздравить Сашу")
      const nameMatch = raw.match(/(?:у|поздравить|для)\s+([А-Яа-яЁёA-Za-z]+)/i);
      if (nameMatch && !['его', 'ее', 'их', 'с', 'днем', 'днём'].includes(nameMatch[1].toLowerCase())) {
        name = this.cleanAndCapitalize(nameMatch[1]);
      }
    }

    // Расчет даты дня рождения
    const targetDate = new Date(today);
    if (lower.includes('через неделю')) {
      targetDate.setDate(targetDate.getDate() + 7);
    } else if (lower.includes('через 2 дня') || lower.includes('послезавтра')) {
      targetDate.setDate(targetDate.getDate() + 2);
    } else if (lower.includes('завтра')) {
      targetDate.setDate(targetDate.getDate() + 1);
    } else {
      // Поиск явной даты ("15 октября", "25 мая")
      const monthMap: Record<string, string> = {
        янв: '01', фев: '02', мар: '03', апр: '04', май: '05', мая: '05',
        июн: '06', июл: '07', авг: '08', сен: '09', окт: '10', ноя: '11', дек: '12',
      };
      const dateMatch = lower.match(/(\d{1,2})\s+(январ|феврал|март|апрел|ма[яе]|июн|июл|август|сентябр|октябр|ноябр|декабр)/i);
      if (dateMatch) {
        const day = dateMatch[1].padStart(2, '0');
        const monthPrefix = dateMatch[2].substring(0, 3).toLowerCase();
        const month = monthMap[monthPrefix] || '10';
        return {
          name,
          relationship,
          birthDate: `${month}-${day}`,
          giftIdeas: ['Выбрать подарок'],
          notes: `Голосовая заметка: ${raw}`,
          avatarColor: colors[Math.floor(Math.random() * colors.length)],
        };
      }
    }

    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');

    return {
      name,
      relationship,
      birthDate: `${mm}-${dd}`,
      giftIdeas: ['Выбрать подарок'],
      notes: `Голосовая заметка: ${raw}`,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  /**
   * Проверка: является ли событие парой / лекцией / официальной встречей.
   * Важно: бытовые дела со временем (например, "убраться дома в 08:00") НЕ считаются парой!
   */
  private isScheduleSegment(lower: string): boolean {
    const academicKeywords = [
      'пара', 'пары', 'лекци', 'практик', 'семинар', 
      'лабораторн', 'лаба', 'лабу', 'экзамен', 'зачет', 
      'созвон', 'zoom', 'зум', 'вебинар', 'консультаци'
    ];

    const hasAcademicWord = academicKeywords.some(w => lower.includes(w));
    const hasRoomNumber = /(?:ауд|каб|аудитори)\.?\s*\d+|\d{3,4}\s*(?:ауд|каб)/i.test(lower);

    return hasAcademicWord || hasRoomNumber;
  }

  /**
   * Извлечение события расписания (пары / созвона)
   */
  private extractSchedule(raw: string, lower: string, today: Date): Omit<ScheduleItem, 'id'> | null {
    let startTime = '10:00';
    let endTime = '11:30';

    const timeMatch = raw.match(/(\d{1,2})[:.](\d{2})/);
    if (timeMatch) {
      const h = timeMatch[1].padStart(2, '0');
      const m = timeMatch[2];
      startTime = `${h}:${m}`;
      const endH = String((Number(h) + 1) % 24).padStart(2, '0');
      endTime = `${endH}:${m}`;
    } else {
      const hourWordMatch = raw.match(/в\s+(\d{1,2})\s*(?:утра|дня|вечера|часов)?/i);
      if (hourWordMatch) {
        let h = Number(hourWordMatch[1]);
        if (lower.includes('вечера') && h < 12) h += 12;
        startTime = `${String(h).padStart(2, '0')}:00`;
        endTime = `${String((h + 1) % 24).padStart(2, '0')}:30`;
      }
    }

    let type: ScheduleType = 'lecture';
    if (lower.includes('лаб')) type = 'lab';
    else if (lower.includes('практик')) type = 'practice';
    else if (lower.includes('созвон') || lower.includes('zoom') || lower.includes('зум')) type = 'call';
    else if (lower.includes('встреч')) type = 'meeting';

    let location = 'Главный корпус';
    if (lower.includes('zoom') || lower.includes('зум') || lower.includes('дистант') || lower.includes('онлайн')) {
      location = 'Zoom / Онлайн';
    } else {
      const roomMatch = raw.match(/(\d{3,4}\s*(?:ауд|каб)?|(?:ауд|каб)\.?\s*\d{3,4})/i);
      if (roomMatch) {
        location = `Ауд. ${roomMatch[0].replace(/ауд|каб|\./gi, '').trim()}`;
      }
    }

    let dayOfWeek = today.getDay();
    if (dayOfWeek === 0) dayOfWeek = 7;
    if (lower.includes('завтра')) {
      dayOfWeek = (dayOfWeek % 7) + 1;
    }

    const cleanTitle = raw
      .replace(/завтра|сегодня|в\s+\d{1,2}[:.]\d{2}|в\s+\d{1,2}\s*(?:утра|дня|вечера|часов)?/gi, '')
      .replace(/пара\s+по|пара|лекция\s+по|лекция|встреча\s+с|встреча|созвон\s+с|созвон/gi, '')
      .replace(/(?:в\s+)?(?:ауд|каб)\.?\s*\d{3,4}|\d{3,4}\s*(?:ауд|каб)?/gi, '')
      .trim();

    return {
      title: cleanTitle ? this.cleanAndCapitalize(cleanTitle) : 'Занятие / Пара',
      type,
      startTime,
      endTime,
      location,
      dayOfWeek,
      notes: `Голосовая заметка: ${raw}`,
    };
  }

  /**
   * Извлечение задачи (Task)
   */
  private extractTask(raw: string, lower: string, todayStr: string): Omit<Task, 'id'> | null {
    // Приоритет
    let priority: Priority = 'medium';
    if (lower.includes('срочно') || lower.includes('горят') || lower.includes('обязательно') || lower.includes('дедлайн')) {
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

    // Извлечение дедлайна по времени (например: "в 08:00", "до 19:30", "к 15:00")
    let dueTime: string | undefined = undefined;
    const explicitTime = raw.match(/(?:в|до|к)\s+(\d{1,2}[:.]\d{2})/i) || raw.match(/(\d{1,2}[:.]\d{2})/);
    if (explicitTime) {
      dueTime = explicitTime[1].replace('.', ':');
      if (dueTime.length === 4) dueTime = '0' + dueTime;
    } else if (lower.includes('вечером')) {
      dueTime = '20:00';
    } else if (lower.includes('утром')) {
      dueTime = '09:00';
    }

    // Оценка времени
    let timeEstimateMin = 30;
    if (lower.includes('позвонить') || lower.includes('набрать') || lower.includes('написать')) timeEstimateMin = 15;
    else if (lower.includes('ужин') || lower.includes('приготовить') || lower.includes('убраться')) timeEstimateMin = 45;
    else if (lower.includes('курсач') || lower.includes('диплом') || lower.includes('реферат') || lower.includes('лабу')) timeEstimateMin = 60;

    // Очистка названия от речевых паразитов и связок
    let cleanTitle = raw
      .replace(/^ты\s+должна\s+прийти\s+и\s+/i, '')
      .replace(/^ты\s+(?:должна|должен)\s+/i, '')
      .replace(/^я\s+(?:должен|должна)\s+/i, '')
      .replace(/^после\s+(?:этого|того|чего)?\s*/i, '')
      .replace(/^(?:после\s+)?надо\s+(?:будет)?\s*/i, '')
      .replace(/^(?:после\s+)?нужно\s+(?:будет)?\s*/i, '')
      .replace(/^придется\s+/i, '')
      .replace(/^будет\s+/i, '')
      .replace(/^не\s+забудь\s+/i, '')
      .replace(/^напомни\s+(?:мне\s+)?/i, '')
      .replace(/\bкакой-нибудь\s+/gi, '')
      .replace(/\s+(?:в|до|к)\s+\d{1,2}[:.]\d{2}/gi, '')
      .replace(/\s+\d{1,2}[:.]\d{2}/gi, '')
      .trim();

    if (!cleanTitle) cleanTitle = raw;

    return {
      title: this.cleanAndCapitalize(cleanTitle),
      category,
      priority,
      timeEstimateMin,
      completed: false,
      dueTime,
      date: todayStr,
    };
  }

  private cleanAndCapitalize(s: string): string {
    const trimmed = s.trim();
    if (!trimmed) return '';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
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
