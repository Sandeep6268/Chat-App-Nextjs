// components/OneSignalProvider.tsx
'use client';
import { useEffect } from 'react';
import { initializeOneSignal } from '@/lib/onesignal';

export default function OneSignalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Initialize OneSignal after component mounts
    const init = async () => {
      try {
        await initializeOneSignal();
        
        // Set up notification click handler
        window.OneSignal = window.OneSignal || [];
        window.OneSignal.push(function() {
          window.OneSignal.on('notificationClick', function(event) {
            console.log('Notification clicked:', event);
            // Handle notification click - navigate to specific chat
            if (event.data && event.data.url) {
              window.location.href = event.data.url;
            }
          });
        });
      } catch (error) {
        console.error('Failed to initialize OneSignal:', error);
      }
    };

    init();
  }, []);

  return <>{children}</>;
}