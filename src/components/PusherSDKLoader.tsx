// components/PusherSDKLoader.tsx
'use client';

import { useEffect } from 'react';

export default function PusherSDKLoader() {
  useEffect(() => {
    // Load Pusher Beams SDK
    const script = document.createElement('script');
    script.src = 'https://js.pusher.com/beams/1.0/push-notifications-cdn.js';
    script.async = true;
    script.onload = () => {
      console.log('✅ Pusher Beams SDK loaded');
    };
    script.onerror = () => {
      console.error('❌ Failed to load Pusher Beams SDK');
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  return null;
}