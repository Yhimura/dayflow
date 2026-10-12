import { NotificationSettings, ScheduleItem, Task, BirthdayEvent } from '../types';
import { tg } from './telegram';

export const DEFAULT_BOT_TOKEN = '8875277564:AAE5qqGExGOGFJXXam1BlyYJY6nwf_Vmi08';

export const notificationService = {
  // Отправка сообщения через Telegram Bot API
  async sendMessage(botToken: string, chatId: string, text: string): Promise<{ success: boolean; error?: string }> {
    if (!botToken || !chatId) {
      return { success: false, error: 'Не указан Bot Token или Chat ID' };
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
    return this.sendMessage(settings.botToken, settings.chatId, text);
  },

  // Форматированное напоминание о паре
  async sendClassReminder(settings: NotificationSettings, item: ScheduleItem): Promise<void> {
    const text = `🔔 <b>Напоминание о паре через ${settings.classRemindMinutes} мин!</b>\n\n📚 <b>${item.title}</b>\n⏰ <b>Время:</b> ${item.startTime} - ${item.endTime}\n📍 <b>Место:</b> ${item.location}${item.teacherOrHost ? `\n👨‍🏫 <b>Преподаватель:</b> ${item.teacherOrHost}` : ''}${item.notes ? `\n💡 <b>Заметки:</b> ${item.notes}` : ''}`;
    await this.sendMessage(settings.botToken, settings.chatId, text);
  },

  // Форматированное напоминание о задаче
  async sendTaskReminder(settings: NotificationSettings, task: Task): Promise<void> {
    const text = `📌 <b>Дедлайн задачи через ${settings.taskRemindMinutes} мин!</b>\n\n✅ <b>${task.title}</b>\n⏱ <b>Оценка времени:</b> ~${task.timeEstimateMin} мин\n🎯 <b>Приоритет:</b> ${task.priority === 'high' ? '🔴 Срочно' : task.priority === 'medium' ? '🟡 Важно' : '🟢 Обычный'}`;
    await this.sendMessage(settings.botToken, settings.chatId, text);
  },

  // Форматированное напоминание о дне рождения
  async sendBirthdayReminder(settings: NotificationSettings, bday: BirthdayEvent, daysLeft: number): Promise<void> {
    const prefix = daysLeft === 0 ? '🎉 <b>СЕГОДНЯ ДЕНЬ РОЖДЕНИЯ!</b>' : `🎂 <b>День рождения через ${daysLeft} дн!</b>`;
    const text = `${prefix}\n\n👤 <b>${bday.name}</b> (${bday.birthDate})\n${bday.giftIdeas.length > 0 ? `🎁 <b>Идеи подарков:</b> ${bday.giftIdeas.join(', ')}\n` : ''}${bday.notes ? `💬 <b>Заметки:</b> ${bday.notes}` : ''}`;
    await this.sendMessage(settings.botToken, settings.chatId, text);
  }
};
