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
    const initializeOneSignal = async () => {
      // Wait for OneSignal SDK to load
      if (typeof window === 'undefined' || !window.OneSignal) {
        console.log('⏳ Waiting for OneSignal SDK to load...');
        return;
      }

      try {
        // Check if already initialized
        if (window.OneSignal.Initialized) {
          console.log('✅ OneSignal already initialized');
          return;
        }

        console.log('🚀 Initializing OneSignal...');

        // Initialize OneSignal with proper config
        await window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { 
            scope: '/onesignal/' 
          },
          serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
          notifyButton: {
            enable: true,
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

        // Set up event listeners for debugging
        window.OneSignal.on('initialized', () => {
          console.log('🎯 OneSignal fully initialized');
        });

        window.OneSignal.on('subscriptionChange', (isSubscribed: boolean) => {
          console.log('📢 Subscription changed:', isSubscribed);
        });

        window.OneSignal.on('notificationPermissionChange', (permission: string) => {
          console.log('🔔 Notification permission:', permission);
        });

        // Get initial state
        const permission = await window.OneSignal.getNotificationPermission();
        const userId = await window.OneSignal.getUserId();
        
        console.log('📊 OneSignal State:', {
          permission,
          userId,
          initialized: window.OneSignal.Initialized
        });

      } catch (error) {
        console.error('❌ OneSignal initialization failed:', error);
      }
    };

    // Load OneSignal SDK if not already loaded
    if (!window.OneSignal) {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.async = true;
      document.head.appendChild(script);
      
      script.onload = initializeOneSignal;
    } else {
      initializeOneSignal();
    }
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
          
          // Also set user properties for segmentation
          await window.OneSignal.setSMSNumber(user.phoneNumber || '');
          await window.OneSignal.setEmail(user.email || '');
        } else {
          await window.OneSignal.removeExternalUserId();
          console.log('✅ OneSignal external user ID removed');
        }
      } catch (error) {
        console.error('❌ Error updating OneSignal user:', error);
      }
    };

    updateOneSignalUser();
  }, [user]);

  return null;
}