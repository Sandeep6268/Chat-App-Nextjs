// components/OneSignalInitializer.tsx - FIXED VERSION
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
      return;
    }

    initializeOneSignal();
  }, [user]);

  const initializeOneSignal = () => {
    try {
      // Clear any existing OneSignal
      window.OneSignal = undefined;
      
      // Load OneSignal script
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.async = true;
      
      script.onload = () => {
        setTimeout(() => {
          setupOneSignal();
        }, 1000);
      };
      
      document.head.appendChild(script);
    } catch (error) {
      console.error('OneSignal initialization error:', error);
    }
  };

  const setupOneSignal = () => {
    try {
      window.OneSignal = window.OneSignal || [];
      
      window.OneSignal.push(function() {
        // Initialize
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
              pageViews: 1,
            }
          }
        });

        console.log('✅ OneSignal initialized');

        // Wait for session to initialize
        window.OneSignal.push(function() {
          // Set external user ID when available
          if (user?.uid) {
            window.OneSignal.setExternalUserId(user.uid);
            console.log('👤 External user ID set:', user.uid);
          }

          // Check subscription status
          window.OneSignal.getUserId().then((userId: string) => {
            if (userId) {
              console.log('🎯 User is subscribed to OneSignal. UserId:', userId);
            } else {
              console.log('❌ User is NOT subscribed to OneSignal');
              // Show subscription prompt
              showSubscriptionPrompt();
            }
          });
        });
      });

    } catch (error) {
      console.error('OneSignal setup error:', error);
    }
  };

  const showSubscriptionPrompt = () => {
    try {
      if (window.OneSignal && window.OneSignal.Slidedown) {
        window.OneSignal.Slidedown.promptPush();
      }
    } catch (error) {
      console.error('Prompt error:', error);
    }
  };

  return null;
}