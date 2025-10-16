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
      try {
        const success = await initializeOneSignal();
        setInitialized(success);
        
        if (success) {
          console.log('OneSignal ready for use');
        }
      } catch (error) {
        console.error('Failed to initialize OneSignal:', error);
      }
    };

    // Initialize after component mounts
    setTimeout(init, 1000);
  }, []);

  return (
    <>
      {children}
      {initialized && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-1 rounded-lg text-sm z-50">
          🔔 Ready
        </div>
      )}
    </>
  );
}