/**
 * Browser Desktop Notification Manager for Lydia Contact Center staff alerts.
 */

export class BrowserNotificationManager {
  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public static getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  }

  public static async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  public static sendNotification(
    title: string,
    options: {
      body: string;
      tag?: string;
      icon?: string;
      onClick?: () => void;
    }
  ): Notification | null {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return null;
    }

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        tag: options.tag,
        badge: '/icon-192.png',
      });

      notification.onclick = () => {
        try {
          window.focus();
        } catch {
          // ignore focus error
        }
        if (options.onClick) {
          options.onClick();
        }
        notification.close();
      };

      // Auto close after 8 seconds
      setTimeout(() => {
        try {
          notification.close();
        } catch {
          // ignore
        }
      }, 8000);

      return notification;
    } catch {
      return null;
    }
  }
}
