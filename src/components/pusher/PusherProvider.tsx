// components/pusher/PusherProvider.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

declare global {
  interface Window {
    PusherPushNotifications?: any;
  }
}

export default function PusherProvider() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const initializePusher = async () => {
      try {
        // Check if Pusher SDK is loaded
        if (!window.PusherPushNotifications) {
          console.log('❌ Pusher SDK not loaded yet');
          return;
        }

        // Register service worker
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/service-worker.js');
          console.log('✅ Service Worker registered for Pusher');
        }

        // Create and start beams client
        const beamsClient = new window.PusherPushNotifications.Client({
          instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
        });

        await beamsClient.start();
        console.log('✅ Pusher Beams initialized for user:', user.uid);

      } catch (error) {
        console.error('❌ Pusher initialization error:', error);
      }
    };

    initializePusher();

    return () => {
      // Cleanup if needed
    };
  }, [user]);

  return null;
}