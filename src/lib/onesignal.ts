// lib/onesignal.ts
import OneSignal from 'react-onesignal';

export const initializeOneSignal = async () => {
  try {
    await OneSignal.init({
      appId: "da31d02e-4dc3-414b-b788-b1cb441a7738",
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerParam: { scope: '/onesignal/' },
      serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
      
      // Optional: Auto prompt for notifications
      promptOptions: {
        slidedown: {
          enabled: true,
          autoPrompt: true,
          timeDelay: 3,
          pageViews: 1,
        }
      }
    });
    
    console.log('✅ OneSignal initialized');
    return true;
  } catch (error) {
    console.error('❌ OneSignal initialization failed:', error);
    return false;
  }
};

// Get current user ID
export const getOneSignalUserId = async (): Promise<string | null> => {
  try {
    const userId = await OneSignal.getUserId();
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

// Check subscription status
export const isSubscribed = async (): Promise<boolean> => {
  try {
    const subscription = await OneSignal.isPushNotificationsEnabled();
    return subscription;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};