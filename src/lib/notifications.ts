// lib/notifications.ts - ADD MISSING METHOD
export class NotificationService {
  
  // Safe permission check
  async requestPermission(): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      
      if ('Notification' in window && window.OneSignal) {
        // Use OneSignal for permission
        await window.OneSignal.showSlidedownPrompt();
        
        // Check result after a delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        const isSubscribed = await window.OneSignal.isPushNotificationsEnabled();
        return isSubscribed;
      }
      
      return false;
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  }

  // 🔥 ADD THIS MISSING METHOD
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

  // 🔥 KEEP THIS METHOD FOR BACKWARD COMPATIBILITY
  async sendTestNotification(title: string, message: string, userId?: string) {
    return this.sendNotification(title, message, userId);
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