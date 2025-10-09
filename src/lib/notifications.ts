// lib/notifications.ts - UPDATED
export class NotificationService {
  // Check if OneSignal is available and initialized
  private isOneSignalReady(): boolean {
    if (typeof window === 'undefined') return false;
    
    const isReady = window.OneSignal && window.OneSignal.Initialized;
    console.log('🔍 OneSignal Ready Check:', isReady);
    return isReady;
  }

  // Get current notification permission
  async getPermission(): Promise<string> {
    if (!this.isOneSignalReady()) {
      console.log('❌ OneSignal not ready for permission check');
      return 'default';
    }

    try {
      const permission = await window.OneSignal.getNotificationPermission();
      console.log('📋 Current permission:', permission);
      return permission;
    } catch (error) {
      console.error('Error getting notification permission:', error);
      return 'default';
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!this.isOneSignalReady()) {
      console.log('❌ OneSignal not ready for permission request');
      return false;
    }

    try {
      console.log('🔔 Requesting notification permission...');
      
      // Use slidedown prompt for better UX
      await window.OneSignal.showSlidedownPrompt();
      
      // Check permission after prompt
      const permission = await this.getPermission();
      console.log('✅ Permission request completed:', permission);
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Get OneSignal user ID
  async getUserId(): Promise<string | null> {
    if (!this.isOneSignalReady()) {
      console.log('❌ OneSignal not ready for user ID check');
      return null;
    }

    try {
      const userId = await window.OneSignal.getUserId();
      console.log('👤 OneSignal User ID:', userId);
      return userId;
    } catch (error) {
      console.error('Error getting OneSignal user ID:', error);
      return null;
    }
  }

  // Send test notification via API (backend)
  async sendTestNotification(title: string, message: string, userId?: string) {
    try {
      console.log('📤 Sending test notification...', { title, message, userId });
      
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
        const errorText = await response.text();
        console.error('❌ Notification API error:', errorText);
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Notification sent successfully:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error sending test notification:', error);
      throw error;
    }
  }

  // Send chat notification
  async sendChatNotification(senderName: string, message: string, chatId: string, targetUserId?: string) {
    try {
      console.log('💬 Sending chat notification...', { senderName, message, chatId, targetUserId });
      
      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `New message from ${senderName}`,
          message: message.length > 50 ? message.substring(0, 50) + '...' : message,
          userId: targetUserId,
          chatId: chatId,
          url: `${window.location.origin}/chat/${chatId}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send chat notification');
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending chat notification:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();