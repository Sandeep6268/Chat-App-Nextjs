// components/OneSignalProvider.tsx
'use client';
import { useEffect, useState } from 'react';
import { initializeOneSignal } from '@/lib/onesignal';

export default function OneSignalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      const success = await initializeOneSignal();
      setInitialized(success);
      
      if (success) {
        // Set up notification handlers
        window.OneSignal = window.OneSignal || [];
        
        // Handle notification click
        OneSignal.on('notificationDisplay', (event) => {
          console.log('Notification displayed:', event);
        });
        
        OneSignal.on('notificationClick', (event) => {
          console.log('Notification clicked:', event);
          // Navigate to specific chat when notification clicked
          if (event.data?.chatId) {
            window.location.href = `/chat/${event.data.chatId}`;
          }
        });
      }
    };

    init();
  }, []);

  return (
    <>
      {children}
      {initialized && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded-lg text-sm">
          🔔 Ready
        </div>
      )}
    </>
  );
}