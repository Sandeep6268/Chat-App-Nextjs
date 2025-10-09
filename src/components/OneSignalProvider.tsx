'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';

const OneSignalProvider = () => {
  useEffect(() => {
    const initializeOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: '/onesignal/' },
          serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
        });

        // Enable automatic prompt
        await OneSignal.showSlidedownPrompt();
        
        // Get the user ID
        const userId = await OneSignal.getUserId();
        console.log('OneSignal User ID:', userId);
        
        // Set notification will show event handler
        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
          console.log('Notification will show:', event);
          event.preventDefault();
          // Display your custom notification UI
          console.log('Custom notification:', event.notification);
        });

        // Set notification click event handler
        OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('Notification clicked:', event);
          // Handle notification click
          window.focus();
        });

        console.log('OneSignal initialized successfully');
      } catch (error) {
        console.error('Error initializing OneSignal:', error);
      }
    };

    initializeOneSignal();
  }, []);

  return null;
};

export default OneSignalProvider;