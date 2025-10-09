// components/pusher/PusherProvider.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { PusherBeamsClient } from '@/lib/pusher-beams-client';

export default function PusherProvider() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Initialize Pusher Beams for logged-in user
      PusherBeamsClient.initialize(user.uid);
    } else {
      // Cleanup when user logs out
      PusherBeamsClient.cleanup();
    }

    return () => {
      // Cleanup on component unmount
      if (user) {
        PusherBeamsClient.cleanup();
      }
    };
  }, [user]);

  return null;
}