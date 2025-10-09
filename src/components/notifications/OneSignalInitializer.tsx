// components/notifications/OneSignalInitializer.tsx - FINAL
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any;
  }
}

export default function OneSignalInitializer() {
  const { user } = useAuth();

  useEffect(() => {
    // Use the deferred loading approach
    const initializeOneSignal = () => {
      if (typeof window === 'undefined') return;

      console.log('🚀 Starting OneSignal initialization...');

      // Use the deferred initialization method
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      const push = function(args: any) {
        window.OneSignalDeferred.push(args);
      };

      // Initialize with deferred loading
      push(() => {
        console.log('🎯 Initializing OneSignal Deferred...');
        
        window.OneSignalDeferred.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          safari_web_id: "",
          notifyButton: {
            enable: false,
          },
          allowLocalhostAsSecureOrigin: true,
          promptOptions: {
            slidedown: {
              enabled: true,
              autoPrompt: true,
              timeDelay: 3,
              pageViews: 1,
            }
          }
        });

        console.log('✅ OneSignal deferred initialization complete');
      });

      // Load the OneSignal SDK
      if (!document.getElementById('oneSignal-sdk')) {
        const script = document.createElement('script');
        script.id = 'oneSignal-sdk';
        script.src = "https://cdn.onesignal.com/sdks/OneSignalSDK.js";
        script.async = true;
        script.onload = () => {
          console.log('✅ OneSignal SDK loaded successfully');
        };
        script.onerror = () => {
          console.error('❌ Failed to load OneSignal SDK');
        };
        document.head.appendChild(script);
      }
    };

    initializeOneSignal();
  }, []);

  // Set external user ID when available
  useEffect(() => {
    const setUserId = async () => {
      if (user) {
        // Wait for OneSignal to be ready
        setTimeout(() => {
          if (window.OneSignalDeferred && typeof window.OneSignalDeferred.setExternalUserId === 'function') {
            window.OneSignalDeferred.setExternalUserId(user.uid);
            console.log('✅ External user ID set:', user.uid);
          }
        }, 3000);
      }
    };

    setUserId();
  }, [user]);

  return null;
}