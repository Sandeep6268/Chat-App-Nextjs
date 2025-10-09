// components/notifications/OneSignalInitializer.tsx - FINAL
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
    const initializeOneSignal = () => {
      if (typeof window === 'undefined') return;

      console.log('🚀 Starting OneSignal initialization...');

      // Initialize OneSignal
      window.OneSignal = window.OneSignal || [];
      
      window.OneSignal.push(function() {
        window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          promptOptions: {
            slidedown: {
              enabled: true,
              autoPrompt: true,
              timeDelay: 3,
              pageViews: 1,
            }
          },
          welcomeNotification: {
            disable: false,
          },
          notifyButton: {
            enable: false,
          },
        });

        console.log('✅ OneSignal initialized');

        // Set up event listeners
        window.OneSignal.on('subscriptionChange', (isSubscribed: boolean) => {
          console.log('📱 Subscription status:', isSubscribed);
        });

        window.OneSignal.on('notificationPermissionChange', (permission: string) => {
          console.log('🔔 Permission changed:', permission);
        });
      });
    };

    // Load OneSignal SDK
    if (!window.OneSignal) {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.async = true;
      script.onload = initializeOneSignal;
      document.head.appendChild(script);
    } else {
      initializeOneSignal();
    }
  }, []);

  // Set external user ID when user logs in
  useEffect(() => {
    const setUser = async () => {
      if (user && window.OneSignal) {
        try {
          await window.OneSignal.setExternalUserId(user.uid);
          console.log('✅ User ID set:', user.uid);
        } catch (error) {
          console.error('Error setting user ID:', error);
        }
      }
    };

    setUser();
  }, [user]);

  return null;
}