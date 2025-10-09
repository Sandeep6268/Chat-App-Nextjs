// lib/chat-notification-service.ts
export class ChatNotificationService {
  // Send notification when new message arrives
  static async sendMessageNotification(
    targetUserId: string,
    senderName: string,
    message: string,
    chatId: string
  ) {
    try {
      const response = await fetch('/api/pusher/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUserId,
          title: `New message from ${senderName}`,
          body: message.length > 50 ? message.substring(0, 50) + '...' : message,
          data: {
            chatId: chatId,
            senderName: senderName,
            type: 'chat_message',
            url: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${chatId}`
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const result = await response.json();
      console.log('💬 Chat notification sent:', result);
      return result;
    } catch (error) {
      console.error('Error sending chat notification:', error);
      return null;
    }
  }

  // Test notification
  static async sendTestNotification(userId: string) {
    try {
      const response = await fetch('/api/pusher/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          title: 'Test Notification 🎉',
          body: 'This is a test notification from your chat app!',
          data: {
            test: true,
            timestamp: new Date().toISOString(),
            url: process.env.NEXT_PUBLIC_APP_URL
          }
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Error sending test notification:', error);
      return null;
    }
  }
}