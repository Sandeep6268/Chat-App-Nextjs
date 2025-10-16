// components/ServiceWorkerSetup.tsx
'use client';
import { useEffect } from 'react';

export default function ServiceWorkerSetup() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          // Try to register OneSignal service worker
          const registration = await navigator.serviceWorker.register(
            'https://cdn.onesignal.com/sdks/OneSignalSDK.sw.js',
            { scope: '/' }
          );
          console.log('✅ Service Worker registered:', registration);
        } catch (error) {
          console.error('❌ Service Worker registration failed:', error);
        }
      }
    };

    registerServiceWorker();
  }, []);

  return null;
}