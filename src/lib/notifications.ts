// lib/notifications.ts
export class NotificationService {
  // Check if OneSignal is available and initialized
  private isOneSignalReady(): boolean {
    return typeof window !== 'undefined' && 
           window.OneSignal && 
           window.OneSignal.Initialized;
  }

  // Get current notification permission
  async getPermission(): Promise<string> {
    if (!this.isOneSignalReady()) return 'default';

    try {
      return await window.OneSignal.getNotificationPermission();
    } catch (error) {
      console.error('Error getting notification permission:', error);
      return 'default';
    }
  }

  // Request notification permission
  async requestPermission(): Promise<void> {
    if (!this.isOneSignalReady()) return;

    try {
      await window.OneSignal.showSlidedownPrompt();
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  }

  // Get OneSignal user ID
  async getUserId(): Promise<string | null> {
    if (!this.isOneSignalReady()) return null;

    try {
      return await window.OneSignal.getUserId();
    } catch (error) {
      console.error('Error getting OneSignal user ID:', error);
      return null;
    }
  }

  // Send test notification via API (backend)
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

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();