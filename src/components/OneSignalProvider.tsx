// components/OneSignalProvider.tsx
'use client';
import { useEffect } from 'react';
import { initializeOneSignal } from '@/lib/onesignal';

declare global {
  interface Window {
    OneSignal: any;
  }
}

export default function OneSignalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        await initializeOneSignal();
        
        // Setup notification handlers - CORRECT WAY
        if (window.OneSignal) {
          // Listen for notification clicks
          window.OneSignal.on('notificationClick', function(event: any) {
            console.log('Notification clicked:', event);
            if (event.data && event.data.url) {
              window.location.href = event.data.url;
            }
          });
        }
      } catch (error) {
        console.error('OneSignal init failed:', error);
      }
    };

    initOneSignal();
  }, []);

  return <>{children}</>;
}