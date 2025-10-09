// lib/notifications.ts - UPDATED
export class NotificationService {
  
  async requestPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.OneSignalDeferred) {
        resolve(false);
        return;
      }

      try {
        window.OneSignalDeferred.showSlidedownPrompt();
        
        // Check after delay
        setTimeout(() => {
          window.OneSignalDeferred.isPushNotificationsEnabled((isSubscribed: boolean) => {
            resolve(isSubscribed);
          });
        }, 3000);
      } catch (error) {
        console.error('Permission error:', error);
        resolve(false);
      }
    });
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