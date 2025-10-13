// lib/notifications.ts - NEW FILE
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
          click_action: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${payload.chatId}`
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Push notification sent successfully to:', userId);
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
  }
};