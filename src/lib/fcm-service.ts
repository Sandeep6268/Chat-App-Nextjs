// lib/fcm-service.ts - NEW FILE
import { messaging } from '@/lib/firebase';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

export class FCMService {
  private static vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  // Request notification permission and get FCM token
  static async requestPermission(userId: string): Promise<string | null> {
    try {
      console.log('🔔 FCM: Requesting notification permission for user:', userId);
      
      if (!messaging) {
        console.log('❌ FCM: Messaging not available');
        return null;
      }

      // Check current permission
      if (Notification.permission === 'denied') {
        console.log('❌ FCM: Notifications are blocked by user');
        return null;
      }

      // Request permission
      console.log('🔔 FCM: Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('🔔 FCM: Permission result:', permission);

      if (permission !== 'granted') {
        console.log('❌ FCM: Permission not granted');
        return null;
      }

      // Get FCM token
      console.log('🔔 FCM: Getting FCM token...');
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey,
      });

      if (token) {
        console.log('✅ FCM: Token received successfully');
        
        // Save token to Firestore
        await this.saveTokenToFirestore(userId, token);
        
        return token;
      } else {
        console.log('❌ FCM: No token received');
        return null;
      }

    } catch (error) {
      console.error('❌ FCM: Error getting token:', error);
      return null;
    }
  }

  // Save FCM token to Firestore
  private static async saveTokenToFirestore(userId: string, token: string) {
    try {
      const db = getFirestore();
      await setDoc(doc(db, 'fcm_tokens', userId), {
        token,
        userId,
        createdAt: new Date(),
        platform: this.getPlatform(),
        userAgent: navigator.userAgent,
      }, { merge: true });
      
      console.log('✅ FCM: Token saved to Firestore for user:', userId);
    } catch (error) {
      console.error('❌ FCM: Error saving token:', error);
    }
  }

  // Listen for foreground messages
  static onMessage(callback: (payload: any) => void) {
    if (!messaging) {
      console.log('❌ FCM: Messaging not available for onMessage');
      return () => {};
    }

    console.log('🔔 FCM: Setting up foreground message listener');
    return onMessage(messaging, (payload) => {
      console.log('🔔 FCM: Foreground message received:', payload);
      callback(payload);
    });
  }

  // Get device platform
  private static getPlatform(): string {
    const userAgent = navigator.userAgent;
    if (/Android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Windows/i.test(userAgent)) return 'windows';
    if (/Mac/i.test(userAgent)) return 'mac';
    return 'web';
  }

  // Check if notifications are supported
  static async isSupported(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    
    try {
      const supported = await import('firebase/messaging').then(({ isSupported }) => 
        isSupported()
      );
      console.log('🔔 FCM: Supported check:', supported);
      return supported;
    } catch (error) {
      console.log('❌ FCM: Support check failed:', error);
      return false;
    }
  }

  // Get current token
  static async getCurrentToken(): Promise<string | null> {
    if (!messaging) return null;
    
    try {
      return await getToken(messaging, { vapidKey: this.vapidKey });
    } catch (error) {
      console.error('❌ FCM: Error getting current token:', error);
      return null;
    }
  }
}