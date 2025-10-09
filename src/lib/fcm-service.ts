// lib/fcm-service.ts - COMPLETE FCM SETUP
import { messaging } from '@/lib/firebase';
import { getToken, onMessage, isSupported } from 'firebase/messaging';
import { doc, setDoc, getFirestore } from 'firebase/firestore';

export class FCMService {
  private static vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

  // Request notification permission and get FCM token
  static async requestPermission(userId: string): Promise<string | null> {
    try {
      console.log('🚀 [FCM] Starting FCM setup for user:', userId);
      
      if (!messaging) {
        console.error('❌ [FCM] Firebase messaging not initialized');
        return null;
      }

      // Check current permission
      console.log('🔔 [FCM] Checking notification permission...');
      const currentPermission = Notification.permission;
      console.log('📋 [FCM] Current permission:', currentPermission);

      if (currentPermission === 'denied') {
        console.error('❌ [FCM] Notifications are blocked by user');
        return null;
      }

      // Request permission if not already granted
      if (currentPermission === 'default') {
        console.log('🔄 [FCM] Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('✅ [FCM] Permission result:', permission);

        if (permission !== 'granted') {
          console.error('❌ [FCM] User denied notification permission');
          return null;
        }
      }

      console.log('🔑 [FCM] Getting FCM token...');
      console.log('🔑 [FCM] Using VAPID Key:', this.vapidKey ? 'Present' : 'Missing');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: this.vapidKey,
      });

      if (token) {
        console.log('✅ [FCM] Token received successfully');
        console.log('🔑 [FCM] Token preview:', token.substring(0, 20) + '...');
        
        // Save token to Firestore
        await this.saveTokenToFirestore(userId, token);
        console.log('💾 [FCM] Token saved to Firestore');
        
        return token;
      } else {
        console.error('❌ [FCM] No token received - check VAPID key and Firebase configuration');
        return null;
      }

    } catch (error: any) {
      console.error('💥 [FCM] Error getting token:', error);
      console.error('🔧 [FCM] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      return null;
    }
  }

  // Save FCM token to Firestore
  private static async saveTokenToFirestore(userId: string, token: string) {
    try {
      const db = getFirestore();
      await setDoc(doc(db, 'fcm_tokens', userId), {
        token: token,
        userId: userId,
        createdAt: new Date(),
        platform: this.getPlatform(),
        userAgent: navigator.userAgent,
        lastUpdated: new Date()
      }, { merge: true });
      
      console.log('💾 [FCM] Token saved for user:', userId);
    } catch (error) {
      console.error('❌ [FCM] Error saving token to Firestore:', error);
    }
  }

  // Listen for foreground messages
  static onMessage(callback: (payload: any) => void) {
    if (!messaging) {
      console.error('❌ [FCM] Messaging not available for onMessage');
      return () => {};
    }

    console.log('👂 [FCM] Setting up foreground message listener');
    
    return onMessage(messaging, (payload) => {
      console.log('📨 [FCM] FOREGROUND MESSAGE RECEIVED:', {
        title: payload.notification?.title,
        body: payload.notification?.body,
        data: payload.data,
        from: payload.from
      });

      // Call the callback with payload
      callback(payload);
    });
  }

  // Listen for background messages (via service worker)
  static setupBackgroundListener() {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 [FCM] BACKGROUND MESSAGE RECEIVED:', event.data);
      });
    }
  }

  // Get device platform
  private static getPlatform(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'mac';
    return 'web';
  }

  // Check if FCM is supported
  static async isSupported(): Promise<boolean> {
    if (typeof window === 'undefined') {
      console.log('❌ [FCM] Not in browser environment');
      return false;
    }
    
    try {
      const supported = await isSupported();
      console.log('🔧 [FCM] Supported check:', supported);
      return supported;
    } catch (error) {
      console.error('❌ [FCM] Support check failed:', error);
      return false;
    }
  }

  // Get current token
  static async getCurrentToken(): Promise<string | null> {
    if (!messaging) return null;
    
    try {
      const token = await getToken(messaging, { vapidKey: this.vapidKey });
      console.log('🔑 [FCM] Current token:', token ? token.substring(0, 20) + '...' : 'No token');
      return token;
    } catch (error) {
      console.error('❌ [FCM] Error getting current token:', error);
      return null;
    }
  }

  // Delete token (logout)
  static async deleteToken(userId: string): Promise<void> {
    try {
      const db = getFirestore();
      await setDoc(doc(db, 'fcm_tokens', userId), {
        deleted: true,
        deletedAt: new Date()
      }, { merge: true });
      console.log('🗑️ [FCM] Token marked as deleted for user:', userId);
    } catch (error) {
      console.error('❌ [FCM] Error deleting token:', error);
    }
  }
}