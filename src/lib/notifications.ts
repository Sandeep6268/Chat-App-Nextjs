import { adminMessaging, adminFirestore } from './firebase/admin';
import { Message, User } from '@/types';

interface NotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data: {
    chatId: string;
    senderId: string;
    messageId?: string;
    type: 'new_message' | 'unread_count';
    click_action: string;
  };
}

export class NotificationService {
  // Store FCM token for user
  static async saveUserFCMToken(userId: string, token: string): Promise<void> {
    try {
      await adminFirestore.collection('users').doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
      throw error;
    }
  }

  // Remove FCM token for user
  static async removeUserFCMToken(userId: string, token: string): Promise<void> {
    try {
      await adminFirestore.collection('users').doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Error removing FCM token:', error);
      throw error;
    }
  }

  // Get FCM tokens for a user
  static async getUserFCMTokens(userId: string): Promise<string[]> {
    try {
      const userDoc = await adminFirestore.collection('users').doc(userId).get();
      const userData = userDoc.data();
      return userData?.fcmTokens || [];
    } catch (error) {
      console.error('Error getting user FCM tokens:', error);
      return [];
    }
  }

  // Send push notification for new message
  static async sendNewMessageNotification({
    recipientId,
    senderName,
    messageText,
    chatId,
    senderId,
  }: {
    recipientId: string;
    senderName: string;
    messageText: string;
    chatId: string;
    senderId: string;
  }): Promise<void> {
    try {
      const tokens = await this.getUserFCMTokens(recipientId);
      if (tokens.length === 0) return;

      const payload: NotificationPayload = {
        title: senderName,
        body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
        data: {
          chatId,
          senderId,
          type: 'new_message',
          click_action: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
        },
      };

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        webpush: {
          headers: {
            Urgency: 'high',
          },
          notification: {
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            actions: [
              {
                action: 'open',
                title: 'Open Chat',
              },
              {
                action: 'dismiss',
                title: 'Dismiss',
              },
            ],
          },
          fcmOptions: {
            link: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await adminMessaging.sendEachForMulticast(message);
      console.log(`📤 Sent ${response.successCount} notifications successfully`);
      
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`❌ Failed to send to token ${tokens[idx]}:`, resp.error);
            // Remove invalid tokens
            if (resp.error?.code === 'messaging/registration-token-not-registered') {
              this.removeUserFCMToken(recipientId, tokens[idx]);
            }
          }
        });
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Send notification for unread count increase
  static async sendUnreadCountNotification({
    recipientId,
    senderName,
    unreadCount,
    chatId,
  }: {
    recipientId: string;
    senderName: string;
    unreadCount: number;
    chatId: string;
  }): Promise<void> {
    try {
      const tokens = await this.getUserFCMTokens(recipientId);
      if (tokens.length === 0) return;

      const payload: NotificationPayload = {
        title: `${senderName}`,
        body: `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`,
        data: {
          chatId,
          senderId: 'system',
          type: 'unread_count',
          click_action: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
        },
      };

      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: payload.data,
        webpush: {
          headers: {
            Urgency: 'normal',
          },
        },
      };

      await adminMessaging.sendEachForMulticast(message);
    } catch (error) {
      console.error('Error sending unread count notification:', error);
    }
  }
}