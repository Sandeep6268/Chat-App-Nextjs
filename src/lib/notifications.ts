// lib/notifications.ts
import { doc, getDoc } from 'firebase/firestore'; // Remove updateDoc
import { firestore } from './firebase';

export interface NotificationPayload {
  title: string;
  body: string;
  chatId: string;
  senderName: string;
  message: string;
}

export const sendPushNotification = async (userId: string, payload: NotificationPayload) => {
  try {
    console.log('🚀 Sending push notification to user:', userId);
    
    // Get user's FCM token
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.log('❌ User not found:', userId);
      return;
    }
    
    const userData = userSnap.data();
    const fcmToken = userData.fcmToken;
    
    if (!fcmToken) {
      console.log('❌ No FCM token for user:', userId);
      return;
    }

    console.log('📨 Sending FCM request for token:', fcmToken.substring(0, 20) + '...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: fcmToken,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          chatId: payload.chatId,
          senderName: payload.senderName,
          message: payload.message,
          click_action: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${payload.chatId}`
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Unknown error from notification API');
    }

    console.log('✅ Push notification sent successfully to:', userId);
  } catch (error: unknown) {
    console.error('❌ Error sending push notification:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorMessage.includes('AbortError')) {
      console.error('⏰ Notification request timed out');
    } else if (errorMessage.includes('404')) {
      console.error('🔍 Notification endpoint not found');
    } else if (errorMessage.includes('500')) {
      console.error('⚡ Server error when sending notification');
    }
  }
};