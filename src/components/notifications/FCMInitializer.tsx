'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getFCMToken } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

export default function FCMInitializer() {
  const { user } = useAuth();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    if (typeof window === 'undefined') return;

    (async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('✅ Service Worker registered:', registration);
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      }
    })();
  }, []);

  useEffect(() => {
    if (!user) return;

    (async () => {
      try {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            fcmToken,
            fcmTokenUpdatedAt: new Date(),
          });
          console.log('✅ Saved FCM token:', fcmToken);
        }
      } catch (err) {
        console.error('❌ Error saving FCM token:', err);
      }
    })();
  }, [user?.uid]);

  return null;
}
