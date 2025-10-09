// lib/onesignal-service.ts - FIXED
import OneSignal from 'react-onesignal';

export class OneSignalService {
  // Request notification permission
  static async requestPermission(): Promise<boolean> {
    try {
      const permission = await OneSignal.Notifications.getPermission();
      console.log('🔔 Current permission:', permission);
      
      if (permission === 'default') {
        await OneSignal.Slidedown.promptPush();
        return true;
      }
      
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Check current permission status
  static async getPermissionStatus(): Promise<boolean> {
    try {
      const permission = await OneSignal.Notifications.getPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error checking permission status:', error);
      return false;
    }
  }

  // Get player ID - CORRECTED
  static async getPlayerId(): Promise<string | null> {
    try {
      const playerId = await OneSignal.User.getId();
      return playerId;
    } catch (error) {
      console.error('Error getting player ID:', error);
      return null;
    }
  }

  // Check if user is subscribed - CORRECTED
  static async isSubscribed(): Promise<boolean> {
    try {
      const isSubscribed = await OneSignal.User.isSubscribed();
      return isSubscribed;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // Send test notification
  static async sendTestNotification(title: string, message: string, data?: any) {
    try {
      const playerId = await this.getPlayerId();
      
      if (!playerId) {
        console.error('No player ID available - user might not be subscribed');
        return { error: 'No player ID available' };
      }

      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          include_player_ids: [playerId],
          headings: { en: title },
          contents: { en: message },
          data: data,
          url: data?.url || window.location.origin
        })
      });

      const result = await response.json();
      console.log('📤 Test notification sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending test notification:', error);
      return { error: error.message };
    }
  }

  // Send chat notification to specific user
  static async sendChatNotification(
    targetPlayerId: string, 
    senderName: string, 
    message: string, 
    chatId: string
  ) {
    try {
      const response = await fetch('https://onesignal.com/api/v1/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
        },
        body: JSON.stringify({
          app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          include_player_ids: [targetPlayerId],
          headings: { en: `New message from ${senderName}` },
          contents: { en: message },
          data: {
            chatId: chatId,
            senderName: senderName,
            type: 'chat_message',
            url: `${window.location.origin}/chat/${chatId}`
          },
          url: `${window.location.origin}/chat/${chatId}`,
          ios_sound: 'notification.wav',
          android_sound: 'notification'
        })
      });

      const result = await response.json();
      console.log('💬 Chat notification sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending chat notification:', error);
      return null;
    }
  }
}