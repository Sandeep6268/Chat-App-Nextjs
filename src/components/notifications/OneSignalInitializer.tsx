// components/notifications/OneSignalInitializer.tsx - FINAL WORKING VERSION
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
    // Simple and reliable initialization
    if (typeof window === 'undefined') return;

    const initOneSignal = () => {
      window.OneSignal = window.OneSignal || [];
      
      // Push initialization to queue
      window.OneSignal.push(function() {
        window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          notifyButton: {
            enable: false,
          },
          promptOptions: {
            slidedown: {
              enabled: true,
              autoPrompt: true,
              timeDelay: 3,
            }
          }
        });
      });

      console.log('✅ OneSignal initialization started');
    };

    // Load OneSignal SDK
    if (!window.OneSignal) {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.async = true;
      script.onload = initOneSignal;
      document.head.appendChild(script);
    } else {
      initOneSignal();
    }
  }, []);

  return null;
}