// lib/notifications.ts
import { doc, getDoc } from 'firebase/firestore';
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

    console.log('📨 Sending FCM notification to token:', fcmToken.substring(0, 20) + '...');

    // Send notification via FCM
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
          click_action: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/chat/${payload.chatId}`
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Push notification sent successfully to:', userId);
    
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
  }
};