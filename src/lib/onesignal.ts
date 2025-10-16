// lib/onesignal.ts
import OneSignal from 'react-onesignal';

export const initializeOneSignal = async () => {
  try {
    if (typeof window === 'undefined') return false;

    // Use CDN service worker directly
    await OneSignal.init({
      appId: "da31d02e-4dc3-414b-b788-b1cb441a7738",
      
      // Service worker configuration
      serviceWorkerParam: { 
        scope: "/"
      },
      
      // Use CDN service worker
      serviceWorkerPath: "https://cdn.onesignal.com/sdks/OneSignalSDK.sw.js",
      
      allowLocalhostAsSecureOrigin: true,
    });

    console.log('✅ OneSignal initialized successfully');
    
    // Setup event listeners
    OneSignal.on('subscriptionChange', (isSubscribed: boolean) => {
      console.log('User subscription changed:', isSubscribed);
    });

    return true;
  } catch (error) {
    console.error('❌ OneSignal initialization failed:', error);
    return false;
  }
};