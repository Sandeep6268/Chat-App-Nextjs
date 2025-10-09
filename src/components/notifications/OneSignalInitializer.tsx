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
    // Wait for page to load completely
    const initializeOneSignal = () => {
      if (typeof window === 'undefined') return;

      console.log('🚀 Initializing OneSignal...');

      // Check if OneSignal is already loaded properly
      if (window.OneSignal && typeof window.OneSignal.init === 'function') {
        console.log('✅ OneSignal already loaded, initializing...');
        initializeOneSignalSDK();
        return;
      }

      // Load OneSignal SDK
      if (!window.OneSignal) {
        console.log('📥 Loading OneSignal SDK...');
        window.OneSignal = window.OneSignal || [];
        
        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.async = true;
        
        script.onload = () => {
          console.log('✅ OneSignal SDK loaded');
          setTimeout(initializeOneSignalSDK, 1000);
        };
        
        script.onerror = () => {
          console.error('❌ Failed to load OneSignal SDK');
        };
        
        document.head.appendChild(script);
      }
    };

    const initializeOneSignalSDK = () => {
      try {
        if (!window.OneSignal || typeof window.OneSignal.init !== 'function') {
          console.log('⏳ OneSignal not ready yet, retrying...');
          setTimeout(initializeOneSignalSDK, 1000);
          return;
        }

        console.log('🎯 Initializing OneSignal SDK...');
        
        window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: '/onesignal/' },
          serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
          promptOptions: {
            slidedown: {
              enabled: true,
              autoPrompt: true,
              timeDelay: 3,
              pageViews: 1,
            }
          }
        });

        console.log('✅ OneSignal initialized successfully');

        // Safe event listeners
        if (window.OneSignal.on && typeof window.OneSignal.on === 'function') {
          window.OneSignal.on('subscriptionChange', (isSubscribed: boolean) => {
            console.log('📱 Subscription changed:', isSubscribed);
          });
        }

      } catch (error) {
        console.error('❌ OneSignal initialization error:', error);
      }
    };

    // Start initialization
    initializeOneSignal();
  }, []);

  // Set external user ID
  useEffect(() => {
    const setExternalUserId = async () => {
      if (user && window.OneSignal && window.OneSignal.setExternalUserId) {
        try {
          await window.OneSignal.setExternalUserId(user.uid);
          console.log('✅ External user ID set:', user.uid);
        } catch (error) {
          console.error('Error setting external user ID:', error);
        }
      }
    };

    setExternalUserId();
  }, [user]);

  return null;
}