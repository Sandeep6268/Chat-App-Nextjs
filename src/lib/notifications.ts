import { firestore } from '@/lib/firebase/client';
import { collection, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';

export class NotificationService {
  // Store FCM token for user
  static async saveUserFCMToken(userId: string, token: string): Promise<void> {
    try {
      console.log('💾 Saving FCM token for user:', userId, 'Token:', token.substring(0, 20) + '...');
      
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
        updatedAt: new Date(),
      });
      
      console.log('✅ FCM token saved successfully');
    } catch (error) {
      console.error('❌ Error saving FCM token:', error);
      throw error;
    }
  }

  // Remove FCM token for user
  static async removeUserFCMToken(userId: string, token: string): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(token),
        updatedAt: new Date(),
      });
      console.log('✅ FCM token removed');
    } catch (error) {
      console.error('❌ Error removing FCM token:', error);
      throw error;
    }
  }

  // Get FCM tokens for a user
  static async getUserFCMTokens(userId: string): Promise<string[]> {
    try {
      const userDoc = await getDoc(doc(firestore, 'users', userId));
      const userData = userDoc.data();
      const tokens = userData?.fcmTokens || [];
      console.log('📱 Retrieved FCM tokens for user:', userId, 'Count:', tokens.length);
      return tokens;
    } catch (error) {
      console.error('❌ Error getting user FCM tokens:', error);
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
      console.log('📤 Sending new message notification to:', recipientId);
      
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          senderName,
          messageText,
          chatId,
          senderId,
          type: 'new_message'
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Notification API error:', result);
        throw new Error(result.error || 'Failed to send notification');
      }

      console.log('✅ Notification sent successfully:', result);

    } catch (error) {
      console.error('❌ Error sending push notification:', error);
      // Don't throw here to avoid breaking the chat flow
    }
  }

  // Send notification for unread count increase
  static async sendUnreadCountNotification({
    recipientId,
    senderName,
    chatId,
  }: {
    recipientId: string;
    senderName: string;
    chatId: string;
  }): Promise<void> {
    try {
      console.log('📤 Sending unread count notification to:', recipientId);
      
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId,
          senderName,
          chatId,
          type: 'unread_count'
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('❌ Unread count notification API error:', result);
        throw new Error(result.error || 'Failed to send unread count notification');
      }

      console.log('✅ Unread count notification sent successfully:', result);

    } catch (error) {
      console.error('❌ Error sending unread count notification:', error);
      // Don't throw here to avoid breaking the chat flow
    }
  }
}