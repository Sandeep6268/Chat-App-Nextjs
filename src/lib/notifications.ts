// lib/notifications.ts - UPDATED
export class NotificationService {
  
  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    try {
      // Try OneSignal first
      if (window.OneSignal) {
        return await window.OneSignal.Notifications.requestPermission();
      }
      
      // Fallback to browser API
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
      console.log('🚀 Sending test notification...', { title, message, userId });

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

      console.log('✅ Test notification sent successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Send notification error:', error);
      throw error;
    }
  }

  async sendChatNotification(senderName: string, message: string, userId: string) {
    try {
      console.log('💬 Sending chat notification...', { senderName, message, userId });
      
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `New message from ${senderName}`,
          message: message.length > 50 ? message.substring(0, 50) + '...' : message,
          userId: userId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send chat notification');
      }

      console.log('✅ Chat notification sent successfully');
      return result;
    } catch (error) {
      console.error('❌ Chat notification error:', error);
      throw error;
    }
  }

  // Check if OneSignal is ready
  isOneSignalReady(): boolean {
    return typeof window !== 'undefined' && !!window.OneSignal;
  }

  // Get current permission status
  async getPermissionStatus(): Promise<string> {
    if (typeof window === 'undefined') return 'unknown';
    
    if (this.isOneSignalReady()) {
      return await window.OneSignal.Notifications.permission;
    }
    
    if ('Notification' in window) {
      return Notification.permission;
    }
    
    return 'unsupported';
  }
}

export const notificationService = new NotificationService();