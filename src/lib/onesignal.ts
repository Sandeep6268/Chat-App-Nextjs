// lib/onesignal.ts
import OneSignal from 'react-onesignal';

export const initializeOneSignal = async () => {
  try {
    // Wait for window to be available
    if (typeof window === 'undefined') return false;

    await OneSignal.init({
      appId: "da31d02e-4dc3-414b-b788-b1cb441a7738",
      
      // Service worker configuration
      serviceWorkerParam: { 
        scope: '/OneSignalSDK/' 
      },
      serviceWorkerPath: 'OneSignalSDKWorker.js',
      
      // Prompt configuration
      promptOptions: {
        slidedown: {
          enabled: true,
          autoPrompt: false, // Manual control
          timeDelay: 1,
          pageViews: 1,
        }
      },
      
      // Allow localhost for development
      allowLocalhostAsSecureOrigin: true,
    });

    console.log('✅ OneSignal initialized successfully');
    
    // Set up event listeners
    OneSignal.on('subscriptionChange', (isSubscribed: boolean) => {
      console.log('Subscription changed:', isSubscribed);
    });

    return true;
  } catch (error) {
    console.error('❌ OneSignal initialization failed:', error);
    return false;
  }
};

export const getOneSignalUserId = async (): Promise<string | null> => {
  try {
    return await OneSignal.getUserId();
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

export const isSubscribed = async (): Promise<boolean> => {
  try {
    return await OneSignal.isPushNotificationsEnabled();
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
};

export const subscribeUser = async (): Promise<boolean> => {
  try {
    await OneSignal.registerForPushNotifications();
    return true;
  } catch (error) {
    console.error('Error subscribing user:', error);
    return false;
  }
};