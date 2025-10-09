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
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeOneSignal = async () => {
      // Wait for OneSignal SDK to load
      if (typeof window === 'undefined') return;

      try {
        // If OneSignal not loaded, load it
        if (!window.OneSignal) {
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
            script.async = true;
            script.onload = resolve;
            document.head.appendChild(script);
          });
        }

        // Wait for OneSignal to be available
        await new Promise((resolve) => {
          const checkOneSignal = () => {
            if (window.OneSignal) {
              resolve(true);
            } else {
              setTimeout(checkOneSignal, 100);
            }
          };
          checkOneSignal();
        });

        // Check if already initialized
        if (window.OneSignal.Initialized) {
          console.log('✅ OneSignal already initialized');
          setInitialized(true);
          return;
        }

        console.log('🚀 Initializing OneSignal with App ID:', process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID);

        // Initialize OneSignal with proper config
        await window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { 
            scope: '/onesignal/' 
          },
          serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
          notifyButton: {
            enable: false, // We'll use custom prompt
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

        console.log('✅ OneSignal initialized successfully');
        setInitialized(true);

        // Set up event listeners for debugging
        window.OneSignal.on('initialized', () => {
          console.log('🎯 OneSignal fully initialized');
        });

        window.OneSignal.on('subscriptionChange', (isSubscribed: boolean) => {
          console.log('📢 Subscription changed:', isSubscribed);
        });

        window.OneSignal.on('notificationPermissionChange', (permission: string) => {
          console.log('🔔 Notification permission changed:', permission);
        });

        // Get initial state
        const permission = await window.OneSignal.getNotificationPermission();
        const userId = await window.OneSignal.getUserId();
        
        console.log('📊 OneSignal Initial State:', {
          permission,
          userId,
          initialized: window.OneSignal.Initialized
        });

      } catch (error) {
        console.error('❌ OneSignal initialization failed:', error);
      }
    };

    initializeOneSignal();
  }, []);

  // Update external user ID when user logs in/out
  useEffect(() => {
    const updateOneSignalUser = async () => {
      if (!window.OneSignal || !window.OneSignal.Initialized) {
        console.log('⏳ OneSignal not ready for user update');
        return;
      }

      try {
        if (user) {
          await window.OneSignal.setExternalUserId(user.uid);
          console.log('✅ OneSignal external user ID set:', user.uid);
        } else {
          await window.OneSignal.removeExternalUserId();
          console.log('✅ OneSignal external user ID removed');
        }
      } catch (error) {
        console.error('❌ Error updating OneSignal user:', error);
      }
    };

    if (initialized) {
      updateOneSignalUser();
    }
  }, [user, initialized]);

  return null;
}