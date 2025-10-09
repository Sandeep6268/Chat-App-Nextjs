// Client-side notification service that calls API routes
export class NotificationService {
  // Store FCM token for user via API
  static async saveUserFCMToken(userId: string, token: string): Promise<void> {
    try {
      const response = await fetch('/api/notifications/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token,
          action: 'save'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save FCM token');
      }
    } catch (error) {
      console.error('Error saving FCM token:', error);
      throw error;
    }
  }

  // Remove FCM token for user via API
  static async removeUserFCMToken(userId: string, token: string): Promise<void> {
    try {
      const response = await fetch('/api/notifications/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          token,
          action: 'remove'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove FCM token');
      }
    } catch (error) {
      console.error('Error removing FCM token:', error);
      throw error;
    }
  }

  // Send push notification for new message via API
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

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const result = await response.json();
      console.log('📤 Notification sent:', result);
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  // Send notification for unread count increase via API
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

      if (!response.ok) {
        throw new Error('Failed to send unread count notification');
      }

      const result = await response.json();
      console.log('📤 Unread count notification sent:', result);
    } catch (error) {
      console.error('Error sending unread count notification:', error);
    }
  }
}