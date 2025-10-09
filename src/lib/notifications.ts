// lib/notifications.ts - FINAL WORKING VERSION
export class NotificationService {
  
  // Request notification permission
  async requestPermission(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !window.OneSignal) {
        console.log('OneSignal not loaded');
        return false;
      }

      // Use browser's native API for permission
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

  // Send notification
  async sendNotification(title: string, message: string, userId?: string) {
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

  // Send chat notification
  async sendChatNotification(senderName: string, message: string, chatId: string) {
    return this.sendNotification(
      `New message from ${senderName}`,
      message.length > 50 ? message.substring(0, 50) + '...' : message
    );
  }
}

export const notificationService = new NotificationService();