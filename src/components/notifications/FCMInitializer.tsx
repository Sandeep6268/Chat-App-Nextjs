// components/notifications/FCMInitializer.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getFCMToken, onForegroundMessage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function FCMInitializer() {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize service worker
    const initializeServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('✅ Service Worker registered:', registration);
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      }
    };

    initializeServiceWorker();
  }, []);

  useEffect(() => {
    // Save FCM token when user logs in
    const saveFCMToken = async () => {
      if (!user) return;

      try {
        const token = await getFCMToken();
        if (token) {
          // Save token to user document
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            fcmToken: token,
            fcmTokenUpdatedAt: new Date()
          });
          console.log('✅ FCM token saved for user:', user.uid);
        }
      } catch (error) {
        console.error('❌ Error saving FCM token:', error);
      }
    };

    saveFCMToken();
  }, [user]);

  useEffect(() => {
    // Handle foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('📱 Received foreground message:', payload);
      
      // Show notification even in foreground
      if (payload.notification) {
        const { title, body } = payload.notification;
        
        // Create browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title || 'New Message', {
            body: body || 'You have a new message',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            tag: payload.data?.chatId,
          });
        }
        
        // Show toast notification
        toast.success(`${title}: ${body}`, {
          duration: 5000,
          position: 'top-right'
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}