'use client';
import { useEffect, useState } from 'react';
import OneSignal from '@onesignal/onesignal-react';

export default function OneSignalProvider({ children }) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize OneSignal
    OneSignal.init({
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerParam: { scope: '/onesignal/' },
      serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
    });

    OneSignal.Slidedown.promptPush();

    // Set event handlers
    OneSignal.Notifications.addEventListener('click', (event) => {
      console.log('Notification clicked:', event);
    });

    OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
      console.log('Notification received in foreground:', event);
      // You can prevent default display and handle it manually
      // event.preventDefault();
      // Your custom notification handling
    });

    OneSignal.User.addEventListener('subscriptionChanged', (isSubscribed) => {
      console.log('User subscription changed:', isSubscribed);
    });

    setIsInitialized(true);
  }, []);

  if (!isInitialized) {
    return <div>Initializing notifications...</div>;
  }

  return children;
}