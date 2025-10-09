// lib/fcm-service.ts - SIMPLE DEBUG VERSION
import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import FCMDebug from './fcm-debug';

export class FCMService {
  private static vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  static async requestPermission(userId: string): Promise<string | null> {
    try {
      FCMDebug.log('Requesting permission for user:', userId);
      
      if (!messaging) {
        FCMDebug.error('Messaging not available');
        return null;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      FCMDebug.log('Permission result:', permission);

      if (permission !== 'granted') {
        FCMDebug.error('Permission not granted');
        return null;
      }

      // Get FCM token
      const token = await getToken(messaging, { vapidKey: this.vapidKey });

      if (token) {
        FCMDebug.success('Token received', { 
          userId, 
          tokenPreview: token.substring(0, 20) + '...' 
        });
        
        // Save token
        await this.saveTokenToFirestore(userId, token);
        
        // Trigger event for debugging
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fcm-token', { detail: { userId, token } }));
        }
        
        return token;
      } else {
        FCMDebug.error('No token received');
        return null;
      }

    } catch (error) {
      FCMDebug.error('Error getting token', error);
      return null;
    }
  }

  // Listen for messages - SIMPLE VERSION
  static onMessage(callback: (payload: any) => void) {
    if (!messaging) {
      FCMDebug.error('Messaging not available for onMessage');
      return () => {};
    }

    FCMDebug.log('Setting up message listener');
    
    return onMessage(messaging, (payload) => {
      FCMDebug.log('📨 NEW MESSAGE RECEIVED:', {
        title: payload.notification?.title,
        body: payload.notification?.body,
        data: payload.data
      });

      // Trigger event for debugging
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('fcm-message', { detail: payload }));
      }

      callback(payload);
    });
  }

  private static async saveTokenToFirestore(userId: string, token: string) {
    try {
      const db = getFirestore();
      await setDoc(doc(db, 'fcm_tokens', userId), {
        token,
        userId,
        createdAt: new Date(),
      }, { merge: true });
      
      FCMDebug.success('Token saved to Firestore', { userId });
    } catch (error) {
      FCMDebug.error('Error saving token', error);
    }
  }
}