// components/notifications/OneSignalInitializer.tsx - UPDATED
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

declare global {
  interface Window {
    OneSignal: any;
  }
}

export default function OneSignalInitializer() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const initializeOneSignal = async () => {
      if (typeof window === 'undefined') return;

      try {
        console.log('🚀 Initializing OneSignal...');

        // Wait for OneSignal SDK to load
        if (!window.OneSignal) {
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
            script.async = true;
            script.onload = resolve;
            document.head.appendChild(script);
          });
        }

        // Initialize OneSignal
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
            disable: false, // Enable welcome notification
          },
        });

        // Check subscription status
        window.OneSignal.on('subscriptionChange', async (isSubscribed: boolean) => {
          console.log('📱 Subscription changed:', isSubscribed);
          setIsSubscribed(isSubscribed);
          
          if (isSubscribed) {
            const userId = await window.OneSignal.getUserId();
            console.log('✅ User subscribed with ID:', userId);
          }
        });

        // Get initial subscription status
        const subscribed = await window.OneSignal.isPushNotificationsEnabled();
        console.log('📱 Initial subscription status:', subscribed);
        setIsSubscribed(subscribed);

        if (!subscribed) {
          console.log('🔔 User not subscribed, showing prompt...');
          // Automatically show prompt if not subscribed
          setTimeout(() => {
            window.OneSignal.showSlidedownPrompt();
          }, 2000);
        }

      } catch (error) {
        console.error('❌ OneSignal initialization failed:', error);
      }
    };

    initializeOneSignal();
  }, []);

  // Update external user ID when user logs in
  useEffect(() => {
    const updateUser = async () => {
      if (window.OneSignal && user && isSubscribed) {
        try {
          await window.OneSignal.setExternalUserId(user.uid);
          console.log('✅ External user ID set:', user.uid);
        } catch (error) {
          console.error('Error setting external user ID:', error);
        }
      }
    };

    updateUser();
  }, [user, isSubscribed]);

  return null;
}