declare global {
  interface Window {
    Telegram?: {
      WebApp: any;
    };
  }
}

export const tg = {
  get app() {
    return window.Telegram?.WebApp;
  },

  init() {
    if (this.app) {
      try {
        this.app.ready();
        this.app.expand();
        this.app.enableClosingConfirmation();
      } catch (e) {
        console.warn('Telegram WebApp init warning:', e);
      }
    }
  },

  haptic(type: 'impact' | 'notification' | 'selection' = 'selection', style?: string) {
    if (!this.app?.HapticFeedback) return;
    try {
      if (type === 'impact') {
        this.app.HapticFeedback.impactOccurred((style as any) || 'medium');
      } else if (type === 'notification') {
        this.app.HapticFeedback.notificationOccurred((style as any) || 'success');
      } else {
        this.app.HapticFeedback.selectionChanged();
      }
    } catch (e) {
      // Ignore if not supported
    }
  },

  getUser() {
    return this.app?.initDataUnsafe?.user || {
      first_name: 'Пользователь',
      username: 'user',
    };
  },

  showAlert(message: string, callback?: () => void) {
    if (this.app?.showAlert) {
      this.app.showAlert(message, callback);
    } else {
      alert(message);
      callback?.();
    }
  }
};
