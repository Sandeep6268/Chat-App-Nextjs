// components/notifications/OneSignalInitializer.tsx - UPDATED
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
    if (typeof window === 'undefined' || !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      console.log('❌ OneSignal: Missing app ID or not in browser');
      return;
    }

    // Load OneSignal SDK if not already loaded
    if (!window.OneSignal) {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        initializeOneSignal();
      };
    } else {
      initializeOneSignal();
    }

    function initializeOneSignal() {
      try {
        window.OneSignal = window.OneSignal || [];
        
        window.OneSignal.push(function() {
          window.OneSignal.init({
            appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
            allowLocalhostAsSecureOrigin: true,
            notifyButton: {
              enable: false,
            },
          });

          console.log('✅ OneSignal initialized');

          // Set external user ID when user is logged in
          if (user?.uid) {
            window.OneSignal.setExternalUserId(user.uid);
            console.log('👤 Set external user ID:', user.uid);
          }

          // Handle notification permission
          window.OneSignal.getNotificationPermission().then((permission: string) => {
            console.log('🔔 Notification permission:', permission);
          });
        });
      } catch (error) {
        console.error('❌ OneSignal initialization error:', error);
      }
    }
  }, [user]);

  return null;
}