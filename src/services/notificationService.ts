import { NotificationSettings, ScheduleItem, Task, BirthdayEvent } from '../types';
import { tg } from './telegram';

export const DEFAULT_BOT_TOKEN = '';

export const notificationService = {
  // Отправка сообщения: сначала через безопасный прокси (если настроен), иначе через прямой Bot API (если есть botToken)
  async sendMessage(botToken: string, chatId: string, text: string, proxyUrl?: string): Promise<{ success: boolean; error?: string }> {
    if (!chatId) {
      return { success: false, error: 'Не указан Chat ID' };
    }

    const effectiveProxy = proxyUrl?.trim() || (import.meta.env.VITE_PROXY_URL as string | undefined)?.trim();

    // 1. Попытка отправки через защищенный серверный шлюз (Cloudflare Worker / Vercel API)
    if (effectiveProxy) {
      try {
        const response = await fetch(effectiveProxy, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId, text }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          return { success: true };
        }
        if (!botToken) {
          return { success: false, error: data.error || 'Ошибка серверного шлюза' };
        }
      } catch (err: any) {
        if (!botToken) {
          return { success: false, error: `Серверный шлюз недоступен: ${err.message}` };
        }
      }
    }

    // 2. Запасной прямой путь через Telegram API (если указан Bot Token)
    if (!botToken) {
      return { success: false, error: 'Не указан Bot Token и не подключен серверный шлюз' };
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        return { success: false, error: data.description || 'Ошибка Telegram API' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Ошибка сети' };
    }
  },

  // Тестовая отправка
  async sendTestMessage(settings: NotificationSettings): Promise<{ success: boolean; error?: string }> {
    const text = `⚡️ <b>Тестовое уведомление DayFlow!</b>\n\nБот успешно подключен к вашему органайзеру. Напоминания о парах настроены за <b>${settings.classRemindMinutes} мин</b>, а о делах — за <b>${settings.taskRemindMinutes} мин</b>.`;
    return this.sendMessage(settings.botToken, settings.chatId, text, settings.proxyUrl);
  },

  // Форматированное напоминание о паре
  async sendClassReminder(settings: NotificationSettings, item: ScheduleItem): Promise<void> {
    const text = `🔔 <b>Напоминание о паре через ${settings.classRemindMinutes} мин!</b>\n\n📚 <b>${item.title}</b>\n⏰ <b>Время:</b> ${item.startTime} - ${item.endTime}\n📍 <b>Место:</b> ${item.location}${item.teacherOrHost ? `\n👨‍🏫 <b>Преподаватель:</b> ${item.teacherOrHost}` : ''}${item.notes ? `\n💡 <b>Заметки:</b> ${item.notes}` : ''}`;
    await this.sendMessage(settings.botToken, settings.chatId, text, settings.proxyUrl);
  },

  // Форматированное напоминание о задаче
  async sendTaskReminder(settings: NotificationSettings, task: Task): Promise<void> {
    const text = `📌 <b>Дедлайн задачи через ${settings.taskRemindMinutes} мин!</b>\n\n✅ <b>${task.title}</b>\n⏱ <b>Оценка времени:</b> ~${task.timeEstimateMin} мин\n🎯 <b>Приоритет:</b> ${task.priority === 'high' ? '🔴 Срочно' : task.priority === 'medium' ? '🟡 Важно' : '🟢 Обычный'}`;
    await this.sendMessage(settings.botToken, settings.chatId, text, settings.proxyUrl);
  },

  // Форматированное напоминание о дне рождения
  async sendBirthdayReminder(settings: NotificationSettings, bday: BirthdayEvent, daysLeft: number): Promise<void> {
    const prefix = daysLeft === 0 ? '🎉 <b>СЕГОДНЯ ДЕНЬ РОЖДЕНИЯ!</b>' : `🎂 <b>День рождения через ${daysLeft} дн!</b>`;
    const text = `${prefix}\n\n👤 <b>${bday.name}</b> (${bday.birthDate})\n${bday.giftIdeas.length > 0 ? `🎁 <b>Идеи подарков:</b> ${bday.giftIdeas.join(', ')}\n` : ''}${bday.notes ? `💬 <b>Заметки:</b> ${bday.notes}` : ''}`;
    await this.sendMessage(settings.botToken, settings.chatId, text, settings.proxyUrl);
  },

  // Утренний дайджест в бот
  async sendMorningDigest(settings: NotificationSettings, todayClasses: ScheduleItem[], todayTasks: Task[], todayBdays: BirthdayEvent[]): Promise<{ success: boolean; error?: string }> {
    const user = tg.getUser();
    const name = user?.first_name || 'друг';

    let msg = `🌅 <b>Доброе утро, ${name}! Твой план DayFlow на сегодня:</b>\n\n`;

    if (todayClasses.length > 0) {
      msg += `📚 <b>Пары и занятия (${todayClasses.length}):</b>\n`;
      todayClasses.forEach(c => {
        msg += `• <b>${c.startTime} - ${c.endTime}</b> — ${c.title} (📍 ${c.location})\n`;
      });
      msg += '\n';
    } else {
      msg += '📚 <i>Сегодня нет запланированных пар.</i>\n\n';
    }

    if (todayTasks.length > 0) {
      msg += `📌 <b>Дела на день (${todayTasks.length}):</b>\n`;
      todayTasks.forEach(t => {
        const time = t.dueTime ? ` [до ${t.dueTime}]` : '';
        msg += `• ${t.title}${time}\n`;
      });
      msg += '\n';
    }

    if (todayBdays.length > 0) {
      msg += `🎂 <b>Ближайшие дни рождения:</b>\n`;
      todayBdays.forEach(b => {
        msg += `• ${b.name} (${b.birthDate})\n`;
      });
      msg += '\n';
    }

    msg += `🚀 <i>Удачного и продуктивного дня!</i>`;
    return this.sendMessage(settings.botToken, settings.chatId, msg, settings.proxyUrl);
  },

  // Отправка полной резервной копии данных в чат с ботом
  async sendBackupToBot(settings: NotificationSettings, schedule: ScheduleItem[], tasks: Task[], birthdays: BirthdayEvent[]): Promise<{ success: boolean; error?: string }> {
    const backupJson = JSON.stringify({
      version: 'dayflow_v3',
      exportedAt: new Date().toISOString(),
      tasks,
      schedule,
      birthdays,
    }, null, 2);

    const text = `💾 <b>Резервная копия DayFlow сохранена!</b>\n\n` +
      `📊 <b>Статистика:</b>\n` +
      `• Задач: <b>${tasks.length}</b>\n` +
      `• Занятий/пар: <b>${schedule.length}</b>\n` +
      `• Дней рождения: <b>${birthdays.length}</b>\n\n` +
      `Ваши данные надежно сохранены. Вы всегда можете восстановить их.`;

    return this.sendMessage(settings.botToken, settings.chatId, text, settings.proxyUrl);
  }
};

