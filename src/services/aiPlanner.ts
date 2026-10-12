import { Task, ScheduleItem, BirthdayEvent, DayAnalysis, DayPlanSlot } from '../types';

export const aiPlanner = {
  // Анализ загруженности текущего дня
  analyzeDay(schedule: ScheduleItem[], tasks: Task[]): DayAnalysis {
    let studyMin = 0;
    schedule.forEach(item => {
      const [startH, startM] = item.startTime.split(':').map(Number);
      const [endH, endM] = item.endTime.split(':').map(Number);
      const duration = (endH * 60 + endM) - (startH * 60 + startM);
      studyMin += Math.max(0, duration);
    });

    const activeTasks = tasks.filter(t => !t.completed);
    const taskMin = activeTasks.reduce((acc, t) => acc + (t.timeEstimateMin || 30), 0);
    const totalOccupiedMin = studyMin + taskMin;

    // В сутках бодрствования примерно 14 часов (840 минут)
    const awakeTimeMin = 840;
    const freeMin = Math.max(0, awakeTimeMin - totalOccupiedMin);

    const stressScore = Math.min(100, Math.round((totalOccupiedMin / 600) * 100));

    let verdict: DayAnalysis['verdict'] = 'optimal';
    const recommendations: string[] = [];

    if (totalOccupiedMin > 540) {
      verdict = 'overloaded';
      recommendations.push('🚨 День перегружен (>9 часов занятости)! Перенесите второстепенные задачи.');
      recommendations.push('🚶 Обязательно выделите минимум 45 минут на полноценный обед и прогулку.');
    } else if (totalOccupiedMin > 420) {
      verdict = 'busy';
      recommendations.push('⚡️ Плотный график. Сосредоточьтесь на задачах высокого приоритета в перерывах.');
      recommendations.push('💧 Делайте 10-минутные паузы между парами и созвонами.');
    } else if (totalOccupiedMin < 180) {
      verdict = 'relaxed';
      recommendations.push('🏖 Спокойный день. Отличное время для долгосрочных проектов или отдыха.');
    } else {
      verdict = 'optimal';
      recommendations.push(' Баланс идеален! Чередуйте фокус-сессии и отдых.');
    }

    return {
      totalOccupiedMin,
      studyMin,
      freeMin,
      stressScore,
      verdict,
      recommendations,
    };
  },

  // Построение сбалансированного почасового расписания дня
  generateOptimizedDayPlan(schedule: ScheduleItem[], tasks: Task[]): DayPlanSlot[] {
    const slots: DayPlanSlot[] = [];

    // 1. Сортируем пары и встречи по времени
    const sortedSchedule = [...schedule].sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Утренний буфер
    slots.push({
      time: '08:00 - 08:45',
      title: 'Утренний ритуал: завтрак, сбор, настройка на день',
      type: 'break',
      durationMin: 45,
    });

    // 2. Встраиваем пары и задачи в окна между ними
    let pendingTasks = tasks.filter(t => !t.completed).sort((a, b) => {
      const pWeights = { high: 3, medium: 2, low: 1 };
      return pWeights[b.priority] - pWeights[a.priority];
    });

    for (let i = 0; i < sortedSchedule.length; i++) {
      const item = sortedSchedule[i];

      // Дорога / подготовка к первой паре
      if (i === 0) {
        slots.push({
          time: `08:45 - ${item.startTime}`,
          title: `Дорога / переход в ${item.location}`,
          type: 'commute',
          durationMin: 15,
        });
      }

      // Само событие
      slots.push({
        time: `${item.startTime} - ${item.endTime}`,
        title: `${item.title} (${item.location})`,
        type: 'schedule',
        durationMin: 90,
        isImportant: true,
      });

      // Если есть следующая пара, смотрим окно
      const nextItem = sortedSchedule[i + 1];
      if (nextItem) {
        const [curEndH, curEndM] = item.endTime.split(':').map(Number);
        const [nextStartH, nextStartM] = nextItem.startTime.split(':').map(Number);
        const gapMin = (nextStartH * 60 + nextStartM) - (curEndH * 60 + curEndM);

        if (gapMin >= 40 && pendingTasks.length > 0) {
          // Вставляем короткую задачу в окно
          const taskToFit = pendingTasks.shift();
          if (taskToFit) {
            slots.push({
              time: `${item.endTime} - ${nextItem.startTime}`,
              title: `Фокус-пауза: ${taskToFit.title}`,
              type: 'task',
              durationMin: gapMin,
            });
          }
        } else if (gapMin > 0) {
          slots.push({
            time: `${item.endTime} - ${nextItem.startTime}`,
            title: gapMin >= 30 ? 'Перерыв на обед / перекус и отдых' : 'Перемена и переход между аудиториями',
            type: 'break',
            durationMin: gapMin,
          });
        }
      }
    }

    // Задачи после окончания пар
    const lastItem = sortedSchedule[sortedSchedule.length - 1];
    let afterTimeH = 18;
    let afterTimeM = 0;
    if (lastItem) {
      const [lH, lM] = lastItem.endTime.split(':').map(Number);
      afterTimeH = lH;
      afterTimeM = lM + 30; // 30 минут на дорогу домой/отдых
      if (afterTimeM >= 60) {
        afterTimeH += 1;
        afterTimeM -= 60;
      }

      slots.push({
        time: `${lastItem.endTime} - ${String(afterTimeH).padStart(2, '0')}:${String(afterTimeM).padStart(2, '0')}`,
        title: 'Дорога домой / смена обстановки',
        type: 'commute',
        durationMin: 30,
      });
    }

    // Размещаем оставшиеся задачи
    pendingTasks.forEach(task => {
      const startStr = `${String(afterTimeH).padStart(2, '0')}:${String(afterTimeM).padStart(2, '0')}`;
      let endM = afterTimeM + (task.timeEstimateMin || 30);
      let endH = afterTimeH;
      while (endM >= 60) {
        endH += 1;
        endM -= 60;
      }
      const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      slots.push({
        time: `${startStr} - ${endStr}`,
        title: `Задача: ${task.title}`,
        type: 'task',
        durationMin: task.timeEstimateMin || 30,
        isImportant: task.priority === 'high',
      });

      afterTimeH = endH;
      afterTimeM = endM + 10; // 10 минут микро-отдых
      if (afterTimeM >= 60) {
        afterTimeH += 1;
        afterTimeM -= 60;
      }
    });

    // Вечерний отдых
    slots.push({
      time: '21:30 - 23:00',
      title: 'Свободное время, общение с друзьями, подготовка ко сну 🌙',
      type: 'break',
      durationMin: 90,
    });

    return slots;
  },

  // Умный разбор пользовательского ввода
  parseUserIntent(text: string): {
    reply: string;
    action?: 'add_task' | 'add_schedule' | 'add_birthday' | 'optimize_day' | 'show_schedule' | 'show_birthdays';
    data?: any;
    suggestions?: string[];
  } {
    const lower = text.toLowerCase();

    // 1. Запрос на оптимизацию дня
    if (lower.includes('распиши') || lower.includes('план') || lower.includes('как все успеть') || lower.includes('график')) {
      return {
        reply: '⚡️ Я проанализировал твои пары, дедлайны и свободные окна. Составил реалистичный почасовой график с учетом дороги и пауз на отдых! Открываю интерактивный планировщик дня.',
        action: 'optimize_day',
        suggestions: ['🎓 Что по парам?', '✅ Какие срочные дела?', 'Обнови список задач'],
      };
    }

    // 2. Добавление пары / встречи
    if (lower.includes('пара') || lower.includes('лекци') || lower.includes('встреч') || lower.includes('созвон')) {
      const timeMatch = text.match(/(\d{1,2}:\d{2})/);
      const roomMatch = text.match(/(\d{3,4}\s*(ауд|каб)?|[a-zа-я]+(?=\s*(ауд|каб)))/i);
      const time = timeMatch ? timeMatch[1] : '12:00';
      const room = roomMatch ? roomMatch[0] : 'Ауд. 301';

      return {
        reply: `Отлично! Я добавил занятие в расписание:\n• Время: ${time}\n• Место: ${room}\n• Запись зафиксирована в локальной памяти и готова к синхронизации с Obsidian!`,
        action: 'add_schedule',
        data: {
          title: text.replace(/добавь|пара|встреча|созвон|в/gi, '').trim() || 'Новое занятие',
          startTime: time,
          location: room,
        },
        suggestions: ['⚡️ Пересчитай план на день', 'Покажи все пары на сегодня'],
      };
    }

    // 3. День рождения
    if (lower.includes('др') || lower.includes('рождени')) {
      return {
        reply: '🎂 Добавил день рождения в календарь памятных дат! Я включил обратный отсчет и напомню тебе заранее, чтобы успеть выбрать подарок.',
        action: 'add_birthday',
        data: {
          text,
        },
        suggestions: ['🎁 Придумай идеи подарка', '🎂 Кто празднует в этом месяце?'],
      };
    }

    // 4. Добавление задачи / напоминалки
    if (lower.includes('напомни') || lower.includes('задач') || lower.includes('сделать') || lower.includes('купить')) {
      const cleanTitle = text.replace(/напомни|добавь|задачу|сделать|нужно/gi, '').trim();
      return {
        reply: ` Записал в список задач: «${cleanTitle || text}»!\nПриоритет выставлен на Высокий, тайминг учтён в твоем дне.`,
        action: 'add_task',
        data: {
          title: cleanTitle || text,
          priority: 'high',
          timeEstimateMin: 30,
        },
        suggestions: ['⚡️ Распиши мой день', 'Какие задачи остались?'],
      };
    }

    // 5. Просмотр пар
    if (lower.includes('пар') || lower.includes('расписание')) {
      return {
        reply: '🎓 Твои пары на сегодня:\n1. 09:00 - 10:30 • Высшая математика (Ауд. 402)\n2. 10:50 - 12:20 • Архитектура ПО (Лаб. 218)\n3. 14:30 - 15:15 • Синхронизация по проекту (Zoom)\n4. 16:00 - 17:30 • Английский для IT (Ауд. 108)',
        action: 'show_schedule',
        suggestions: ['⚡️ Распиши план на день', '✅ Что нужно сдать сегодня?'],
      };
    }

    // 6. Дни рождения
    if (lower.includes('кто') && lower.includes('др') || lower.includes('именинник')) {
      return {
        reply: '🎉 Ближайшие праздники:\n• Артём Соколов — через 3 дня (15 октября, 21 год). Подарок: клавиатура / сертификат Steam.\n• Мама ❤️ — через 12 дней (24 октября).',
        action: 'show_birthdays',
        suggestions: ['🎁 Идеи для подарка маме', '⚡️ Вернуться к делам дня'],
      };
    }

    // Дефолтный интеллектуальный ответ
    return {
      reply: `Принято! Я готов помочь распланировать задачи, записать напоминание или ответить на срочные вопросы. Напиши, что именно нужно сделать!`,
      suggestions: [
        '⚡️ Распиши мой день по минутам',
        '🎓 Что у меня на сегодня?',
        'Добавь задачу: сдать реферат',
        '🎂 У кого скоро ДР?',
      ],
    };
  },

  // Экспорт в Obsidian Markdown Daily Note
  exportToObsidianMarkdown(date: string, schedule: ScheduleItem[], tasks: Task[], analysis: DayAnalysis): string {
    return `# 📅 Daily Note: ${date}

## ⚡️ Анализ дня
- **Занятость:** ${Math.round(analysis.totalOccupiedMin / 60)} ч ${analysis.totalOccupiedMin % 60} мин
- **Уровень стресса:** ${analysis.stressScore}% (${analysis.verdict})
- **Рекомендации:** ${analysis.recommendations.join(' ')}

## 🎓 Расписание пар и встреч
${schedule.map(s => `- [ ] **${s.startTime} - ${s.endTime}** :: ${s.title} (${s.location}) - _${s.teacherOrHost || ''}_`).join('\n')}

##  Задачи на день
${tasks.map(t => `- [${t.completed ? 'x' : ' '}] ${t.title} [приоритет:: ${t.priority}] [время:: ${t.timeEstimateMin}м]`).join('\n')}

---
*Создано автоматически через Telegram Mini App Planner*
`;
  }
};
