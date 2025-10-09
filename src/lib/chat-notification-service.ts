// lib/chat-notification-service.ts - IMPROVED VERSION
export class ChatNotificationService {
  // Send notification when new message arrives - IMPROVED
  static async sendMessageNotification(
    targetUserId: string,
    senderName: string,
    message: string,
    chatId: string
  ) {
    try {
      console.log(`📤 [NOTIFICATION] Sending to: ${targetUserId}, From: ${senderName}`);
      
      const response = await fetch('/api/pusher/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUserId,
          title: `💬 New message from ${senderName}`,
          body: message.length > 100 ? message.substring(0, 100) + '...' : message,
          data: {
            chatId: chatId,
            senderName: senderName,
            type: 'chat_message',
            url: `${window.location.origin}/chat/${chatId}`,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [NOTIFICATION] API error:', errorText);
        throw new Error(`Notification failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ [NOTIFICATION] Successfully sent:', result);
      return result;
    } catch (error) {
      console.error('❌ [NOTIFICATION] Error:', error);
      // Don't throw error to prevent breaking the chat
      return { success: false, error: error.message };
    }
  }
}