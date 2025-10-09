// components/onesignal/DebugOneSignal.tsx
'use client';

import { useEffect, useState } from 'react';
import OneSignal from 'react-onesignal';

export default function DebugOneSignal() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const checkOneSignal = async () => {
      const info: any = {};
      
      try {
        // Check if OneSignal is available
        info.oneSignalAvailable = typeof OneSignal !== 'undefined';
        info.windowAvailable = typeof window !== 'undefined';
        info.appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        
        if (info.oneSignalAvailable) {
          info.permission = await OneSignal.Notifications.getPermission();
          info.playerId = await OneSignal.User.getId();
          info.isSubscribed = await OneSignal.User.isSubscribed();
        }
      } catch (error) {
        info.error = error.message;
      }
      
      setDebugInfo(info);
    };

    checkOneSignal();
  }, []);

  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h3 className="font-bold text-red-800 mb-2">OneSignal Debug Info:</h3>
      <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
    </div>
  );
}