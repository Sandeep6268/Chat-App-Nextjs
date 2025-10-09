// components/notifications/OneSignalInitializer.tsx - FINAL
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function OneSignalInitializer() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // OneSignal initialization with proper loading
    window.OneSignal = window.OneSignal || [];
    
    // Initialize immediately
    window.OneSignal.push(function() {
      window.OneSignal.init({
        appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
        allowLocalhostAsSecureOrigin: true,
        notifyButton: {
          enable: false,
        },
      });
    });

    console.log('✅ OneSignal initialization started');

  }, []);

  return null;
}