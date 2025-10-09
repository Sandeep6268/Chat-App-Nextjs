// lib/notifications.ts - FINAL
export class NotificationService {
  
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      return false;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }

  async sendTestNotification(title: string, message: string, userId?: string) {
    try {
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          message,
          userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send notification');
      }

      return result;
    } catch (error) {
      console.error('Send notification error:', error);
      throw error;
    }
  }

  async sendChatNotification(senderName: string, message: string, chatId: string) {
    return this.sendTestNotification(
      `New message from ${senderName}`,
      message.length > 50 ? message.substring(0, 50) + '...' : message
    );
  }
}

export const notificationService = new NotificationService();