// components/onesignal/OneSignalProvider.tsx - FIXED
'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@/components/auth/AuthProvider';

export default function OneSignalProvider() {
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (initialized || !user) return;

    const initializeOneSignal = async () => {
      try {
        console.log('🚀 Starting OneSignal initialization...');
        console.log('📱 App ID:', process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID);
        
        // Check if we're in a supported environment
        if (typeof window === 'undefined') {
          console.log('❌ OneSignal: Window object not available');
          return;
        }

        if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
          console.error('❌ OneSignal App ID is missing');
          return;
        }

        // Initialize OneSignal
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: '/' },
          serviceWorkerPath: 'OneSignalSDKWorker.js',
        });

        console.log('✅ OneSignal initialized successfully');
        setInitialized(true);

        // Set up event listeners
        setupEventListeners();

        // Show permission prompt if not already granted
        const currentPermission = await OneSignal.Notifications.getPermission();
        if (currentPermission === 'default') {
          OneSignal.Slidedown.promptPush();
        }

      } catch (error) {
        console.error('❌ OneSignal initialization failed:', error);
      }
    };

    initializeOneSignal();

    return () => {
      // Cleanup if needed
    };
  }, [user, initialized]);

  const setupEventListeners = () => {
    try {
      // Notification permission changed - CORRECTED
      OneSignal.Notifications.addEventListener('permissionChange', (permission) => {
        console.log('🔔 Notification permission changed:', permission);
      });

      // Notification subscription changed - CORRECTED
      OneSignal.User.addEventListener('subscriptionChange', (isSubscribed) => {
        console.log('📱 Subscription changed:', isSubscribed);
      });

      // Notification click - CORRECTED
      OneSignal.Notifications.addEventListener('click', (event) => {
        console.log('🖱️ Notification clicked:', event);
        handleNotificationClick(event);
      });

      // Notification received while app is in foreground - CORRECTED
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
        console.log('📱 Foreground notification:', event);
        // You can customize how notifications appear in foreground
        // CORRECTED: Use the correct method to display notification
        event.preventDefault(); // Prevent default display
        // Or show custom notification
        const notification = event.notification;
        console.log('Foreground notification:', notification);
        // notification.display(); // This method might not exist, use custom UI instead
      });

    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }
  };

  const handleNotificationClick = (event: any) => {
    try {
      const notification = event.notification;
      const data = notification.additionalData;
      
      console.log('🖱️ Notification clicked with data:', data);

      // Handle navigation based on notification data
      if (data?.chatId) {
        window.location.href = `/chat/${data.chatId}`;
      } else if (data?.url) {
        window.location.href = data.url;
      } else {
        // Default behavior - focus the app
        window.focus();
      }
      
      // CORRECTED: Close notification properly
      notification.close();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  return null;
}