// components/pusher/PusherProvider.tsx - IMPROVED
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

declare global {
  interface Window {
    PusherPushNotifications?: any;
  }
}

export default function PusherProvider() {
  const { user } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!user || initialized) return;

    const initializePusher = async () => {
      try {
        console.log('🚀 [PUSHER DEBUG] Initializing Pusher Beams...');

        // Check if Pusher SDK is loaded
        if (!window.PusherPushNotifications) {
          console.log('❌ [PUSHER DEBUG] Pusher SDK not loaded yet, retrying...');
          // Retry after 2 seconds
          setTimeout(initializePusher, 2000);
          return;
        }

        console.log('✅ [PUSHER DEBUG] Pusher SDK loaded');

        // Register service worker
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/service-worker.js');
            console.log('✅ [PUSHER DEBUG] Service Worker registered');
            
            // Wait for service worker to be ready
            if (registration.installing) {
              registration.installing.addEventListener('statechange', (e) => {
                if ((e.target as any)?.state === 'activated') {
                  startPusherClient();
                }
              });
            } else {
              startPusherClient();
            }
          } catch (error) {
            console.error('❌ [PUSHER DEBUG] Service Worker registration failed:', error);
            startPusherClient(); // Try starting anyway
          }
        } else {
          startPusherClient();
        }

      } catch (error) {
        console.error('❌ [PUSHER DEBUG] Pusher initialization error:', error);
      }
    };

    const startPusherClient = async () => {
      try {
        const beamsClient = new window.PusherPushNotifications.Client({
          instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
        });

        await beamsClient.start();
        setInitialized(true);
        console.log('✅ [PUSHER DEBUG] Pusher Beams initialized for user:', user.uid);

        // Check subscription status
        const state = await beamsClient.getRegistrationState();
        console.log(`📊 [PUSHER DEBUG] Registration state: ${state}`);

      } catch (error) {
        console.error('❌ [PUSHER DEBUG] Pusher client start failed:', error);
      }
    };

    initializePusher();

    return () => {
      // Cleanup if needed
    };
  }, [user, initialized]);

  return null;
}