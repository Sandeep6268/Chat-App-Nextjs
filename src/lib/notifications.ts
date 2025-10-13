// lib/notifications.ts
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

    // Send notification via FCM with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

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
  } catch (error: any) {
    console.error('❌ Error sending push notification:', error);
    
    // Log specific error details
    if (error.name === 'AbortError') {
      console.error('⏰ Notification request timed out');
    } else if (error.message.includes('404')) {
      console.error('🔍 Notification endpoint not found');
    } else if (error.message.includes('500')) {
      console.error('⚡ Server error when sending notification');
    }
  }
};