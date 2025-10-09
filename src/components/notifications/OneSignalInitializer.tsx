// components/notifications/OneSignalInitializer.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

declare global {
  interface Window {
    OneSignal: any;
  }
}

export default function OneSignalInitializer() {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize OneSignal when component mounts
    const initializeOneSignal = async () => {
      if (typeof window !== 'undefined' && window.OneSignal) {
        try {
          // Initialize OneSignal
          await window.OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
            allowLocalhostAsSecureOrigin: true,
            serviceWorkerParam: { scope: '/onesignal/' },
            serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
            notificationClickHandlerMatch: 'origin',
            notificationClickHandlerAction: 'navigate',
          });

          console.log('✅ OneSignal initialized successfully');

          // Set external user ID when user is logged in
          if (user) {
            await window.OneSignal.setExternalUserId(user.uid);
            console.log('✅ External user ID set:', user.uid);
          }

          // Register for push notifications
          await window.OneSignal.showSlidedownPrompt();
          
        } catch (error) {
          console.error('❌ OneSignal initialization failed:', error);
        }
      }
    };

    initializeOneSignal();
  }, [user]);

  // Update external user ID when user changes
  useEffect(() => {
    const updateUser = async () => {
      if (user && window.OneSignal) {
        try {
          await window.OneSignal.setExternalUserId(user.uid);
          console.log('✅ External user ID updated:', user.uid);
        } catch (error) {
          console.error('❌ Failed to update external user ID:', error);
        }
      } else if (!user && window.OneSignal) {
        // Remove external user ID when user logs out
        try {
          await window.OneSignal.removeExternalUserId();
          console.log('✅ External user ID removed');
        } catch (error) {
          console.error('❌ Failed to remove external user ID:', error);
        }
      }
    };

    updateUser();
  }, [user]);

  return null;
}