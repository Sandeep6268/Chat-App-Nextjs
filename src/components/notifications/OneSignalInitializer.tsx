// components/notifications/OneSignalInitializer.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

// Declare OneSignal types
declare global {
  interface Window {
    OneSignal: any;
  }
}

export default function OneSignalInitializer() {
  const { user } = useAuth();

  useEffect(() => {
    // Initialize OneSignal
    const initializeOneSignal = () => {
      if (typeof window === 'undefined' || !window.OneSignal) {
        console.log('⏳ OneSignal SDK not loaded yet');
        return;
      }

      try {
        // Check if already initialized
        if (window.OneSignal.Initialized) {
          console.log('✅ OneSignal already initialized');
          return;
        }

        // Initialize OneSignal
        window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: '/onesignal/' },
          serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
        });

        console.log('✅ OneSignal initialized successfully');

        // Set up event listeners
        window.OneSignal.on('subscriptionChange', (isSubscribed: boolean) => {
          console.log('📢 User subscription changed:', isSubscribed);
        });

        // Show prompt after initialization
        setTimeout(() => {
          window.OneSignal.showSlidedownPrompt();
        }, 3000);

      } catch (error) {
        console.error('❌ OneSignal initialization failed:', error);
      }
    };

    // Wait for OneSignal SDK to load
    if (window.OneSignal) {
      initializeOneSignal();
    } else {
      // If SDK not loaded, wait for it
      window.addEventListener('load', initializeOneSignal);
      return () => window.removeEventListener('load', initializeOneSignal);
    }
  }, []);

  // Update external user ID when user logs in/out
  useEffect(() => {
    const updateOneSignalUser = async () => {
      if (!window.OneSignal || !window.OneSignal.Initialized) {
        return;
      }

      try {
        if (user) {
          // Set external user ID for targeted notifications
          await window.OneSignal.setExternalUserId(user.uid);
          console.log('✅ OneSignal external user ID set:', user.uid);
        } else {
          // Remove external user ID when user logs out
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