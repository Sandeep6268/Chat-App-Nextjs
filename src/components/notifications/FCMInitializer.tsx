// components/notifications/FCMInitializer.tsx - FIXED VERSION
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getFCMToken, onForegroundMessage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export default function FCMInitializer() {
  const { user } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Initialize service worker
    const initializeServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Use simpler registration
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
          });
          console.log('✅ Service Worker registered:', registration);
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      } else {
        console.log('❌ Service Worker not supported');
      }
    };

    initializeServiceWorker();
  }, []);

  useEffect(() => {
    // Get FCM token
    const initializeFCM = async () => {
      try {
        const fcmToken = await getFCMToken();
        setToken(fcmToken);
        
        if (fcmToken && user) {
          // Save token to user document
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            fcmToken: fcmToken,
            fcmTokenUpdatedAt: new Date()
          });
          console.log('✅ FCM token saved for user:', user.uid);
        }
      } catch (error) {
        console.error('❌ Error in FCM initialization:', error);
      }
    };

    initializeFCM();
  }, [user]);

  useEffect(() => {
    // Handle foreground messages
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('📱 Received foreground message:', payload);
      
      // Show notification even in foreground
      if (payload.notification && 'Notification' in window && Notification.permission === 'granted') {
        const { title, body } = payload.notification;
        
        new Notification(title || 'New Message', {
          body: body || 'You have a new message',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: payload.data?.chatId,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{ display: 'none' }}>
      FCM Status: {token ? '✅ Ready' : '❌ Not Ready'}
    </div>
  );
}