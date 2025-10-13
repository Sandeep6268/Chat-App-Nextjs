// components/notifications/FCMInitializer.tsx
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

    // Initialize service worker
    const initializeServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // For Vercel, use the correct path
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/',
            updateViaCache: 'none' // Important for updates
          });
          
          console.log('✅ Service Worker registered:', registration);
          
          // Check if service worker is actually controlling the page
          if (navigator.serviceWorker.controller) {
            console.log('✅ Service Worker is controlling the page');
          } else {
            console.log('❌ Service Worker is not controlling the page');
          }
          
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      } else {
        console.log('❌ Service Worker not supported');
      }
    };

    // Wait for page to load before registering service worker
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeServiceWorker);
    } else {
      initializeServiceWorker();
    }
  }, []);

  useEffect(() => {
    // Get FCM token only once per user
    const initializeFCM = async () => {
      if (!user) return;

      try {
        console.log('🔄 Initializing FCM for user:', user.uid);
        
        // Wait a bit for service worker to be ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const fcmToken = await getFCMToken();
        
        if (fcmToken) {
          // Save token to user document
          const userRef = doc(firestore, 'users', user.uid);
          await updateDoc(userRef, {
            fcmToken: fcmToken,
            fcmTokenUpdatedAt: new Date()
          });
          console.log('✅ FCM token saved for user:', user.uid);
        } else {
          console.log('❌ No FCM token obtained');
        }
      } catch (error) {
        console.error('❌ Error in FCM initialization:', error);
      }
    };

    initializeFCM();
  }, [user?.uid]);

  return null;
}