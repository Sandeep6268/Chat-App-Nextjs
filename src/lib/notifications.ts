// lib/notifications.ts - FINAL
export class NotificationService {
  
  async requestPermission(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.OneSignal) {
        return false;
      }

      // Wait for OneSignal to be ready
      if (typeof window.OneSignal.showSlidedownPrompt === 'function') {
        await window.OneSignal.showSlidedownPrompt();
        
        // Check subscription after delay
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (typeof window.OneSignal.isPushNotificationsEnabled === 'function') {
          return await window.OneSignal.isPushNotificationsEnabled();
        }
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