// components/pusher/PusherProvider.tsx - WORKING VERSION
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
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!user) return;

    const initializePusher = async () => {
      try {
        setStatus('loading');
        console.log('🚀 Starting Pusher Beams setup...');

        // Step 1: Wait for Pusher SDK
        if (!window.PusherPushNotifications) {
          console.log('⏳ Pusher SDK not loaded, waiting...');
          // Load SDK manually
          await new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://js.pusher.com/beams/1.0/push-notifications-cdn.js';
            script.onload = resolve;
            script.onerror = resolve;
            document.head.appendChild(script);
          });
          
          if (!window.PusherPushNotifications) {
            throw new Error('Pusher SDK failed to load');
          }
        }

        console.log('✅ Pusher SDK loaded');

        // Step 2: Register Service Worker
        if (!('serviceWorker' in navigator)) {
          throw new Error('Service Workers not supported');
        }

        console.log('📋 Registering service worker...');
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        console.log('✅ Service Worker registered');

        // Step 3: Wait for service worker to be ready
        if (registration.installing) {
          await new Promise((resolve) => {
            registration.installing.addEventListener('statechange', (e) => {
              if ((e.target as any)?.state === 'activated') {
                resolve(null);
              }
            });
          });
        }

        // Step 4: Start Pusher Client
        console.log('🔄 Starting Pusher client...');
        const beamsClient = new window.PusherPushNotifications.Client({
          instanceId: process.env.NEXT_PUBLIC_PUSHER_BEAMS_INSTANCE_ID!,
        });

        await beamsClient.start();
        console.log('✅ Pusher client started');

        // Step 5: Check and request permission
        const state = await beamsClient.getRegistrationState();
        console.log('📊 Registration state:', state);

        if (state === 'PERMISSION_GRANTED_REGISTERED_WITH_BEAMS') {
          console.log('🎉 Pusher Beams ready!');
          setStatus('success');
        } else {
          console.log('🔔 Requesting notification permission...');
          const permission = await Notification.requestPermission();
          console.log('📱 Permission result:', permission);
          
          if (permission === 'granted') {
            setStatus('success');
            console.log('🎉 Notifications enabled!');
          } else {
            setStatus('error');
            console.log('❌ Notifications not granted');
          }
        }

      } catch (error) {
        console.error('❌ Pusher setup failed:', error);
        setStatus('error');
      }
    };

    initializePusher();
  }, [user]);

  // Show status in console
  useEffect(() => {
    if (status === 'success') {
      console.log('✅ Pusher Beams: READY for notifications');
    } else if (status === 'error') {
      console.log('❌ Pusher Beams: Setup failed');
    }
  }, [status]);

  return null;
}