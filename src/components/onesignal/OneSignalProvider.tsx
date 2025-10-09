// components/onesignal/OneSignalProvider.tsx
'use client';

import { useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { useAuth } from '@/components/auth/AuthProvider';

export default function OneSignalProvider() {
  const { user } = useAuth();

  useEffect(() => {
    const initializeOneSignal = async () => {
      try {
        console.log('🚀 Initializing OneSignal...');
        
        await OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: '/' },
          serviceWorkerPath: 'OneSignalSDKWorker.js',
          notificationClickHandlerMatch: 'origin',
          notificationClickHandlerAction: 'navigate',
        });

        console.log('✅ OneSignal initialized successfully');

        // Check if notifications are supported and permission is granted
        const permission = await OneSignal.Notifications.permission;
        console.log('📱 Notification permission:', permission);

        if (permission) {
          // Get the player ID (user ID in OneSignal)
          const playerId = await OneSignal.User.pushSubscription.id;
          console.log('🎯 OneSignal Player ID:', playerId);

          if (playerId && user) {
            // Store the player ID in your database for sending targeted notifications
            await storePlayerId(user.uid, playerId);
            console.log('💾 Player ID stored for user:', user.uid);
          }
        }

        // Set up notification handlers
        OneSignal.Notifications.addEventListener('click', (event) => {
          console.log('🔔 Notification clicked:', event);
          handleNotificationClick(event);
        });

        OneSignal.Notifications.addEventListener('foregroundWillDisplay', (event) => {
          console.log('📱 Notification received in foreground:', event);
          // You can customize the notification display here
          event.preventDefault(); // Prevent default display
          // Or allow it to show: event.notification.display();
        });

      } catch (error) {
        console.error('❌ OneSignal initialization failed:', error);
      }
    };

    if (user) {
      initializeOneSignal();
    }
  }, [user]);

  const storePlayerId = async (userId: string, playerId: string) => {
    try {
      // Store the player ID in Firestore for sending targeted notifications
      const { doc, setDoc, getFirestore } = await import('firebase/firestore');
      const { firestore } = await import('@/lib/firebase');
      
      const userRef = doc(firestore, 'users', userId);
      await setDoc(userRef, {
        oneSignalPlayerId: playerId,
        notificationEnabled: true,
      }, { merge: true });
      
    } catch (error) {
      console.error('Error storing player ID:', error);
    }
  };

  const handleNotificationClick = (event: any) => {
    const notification = event.notification;
    const data = notification.additionalData;
    
    console.log('🖱️ Notification clicked with data:', data);

    // Handle navigation based on notification data
    if (data?.chatId) {
      // Navigate to the specific chat
      window.location.href = `/chat/${data.chatId}`;
    } else if (data?.url) {
      // Navigate to custom URL
      window.location.href = data.url;
    }
    
    // Dismiss the notification
    notification.close();
  };

  return null; // This component doesn't render anything
}