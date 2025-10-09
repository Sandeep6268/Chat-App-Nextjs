// lib/onesignal-service.ts
import OneSignal from 'react-onesignal';

export class OneSignalService {
  // Request notification permission
  static async requestPermission(): Promise<boolean> {
    try {
      const permission = await OneSignal.Notifications.requestPermission();
      console.log('🔔 Permission request result:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Check current permission status
  static async getPermissionStatus(): Promise<boolean> {
    try {
      const permission = await OneSignal.Notifications.permission;
      return permission;
    } catch (error) {
      console.error('Error checking permission status:', error);
      return false;
    }
  }

  // Get player ID
  static async getPlayerId(): Promise<string | null> {
    try {
      const playerId = await OneSignal.User.pushSubscription.id;
      return playerId;
    } catch (error) {
      console.error('Error getting player ID:', error);
      return null;
    }
  }

  // Send test notification
  static async sendTestNotification(title: string, message: string, data?: any) {
    try {
      const playerId = await this.getPlayerId();
      
      if (!playerId) {
        console.error('No player ID available');
        return false;
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
      return null;
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