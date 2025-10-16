// lib/onesignal.ts
import OneSignal from 'react-onesignal';

export const initializeOneSignal = async () => {
  try {
    if (typeof window === 'undefined') return false;

    // OneSignal automatic service worker setup
    await OneSignal.init({
      appId: "da31d02e-4dc3-414b-b788-b1cb441a7738",
      
      // Let OneSignal handle service worker automatically
      allowLocalhostAsSecureOrigin: true,
      
      // Notification prompt settings
      promptOptions: {
        slidedown: {
          enabled: true,
          autoPrompt: false, // We'll trigger manually
        }
      }
    });

    console.log('✅ OneSignal initialized');
    return true;
  } catch (error) {
    console.error('❌ OneSignal init error:', error);
    return false;
  }
};

export const getOneSignalUserId = async (): Promise<string | null> => {
  try {
    return await OneSignal.getUserId();
  } catch (error) {
    return null;
  }
};

export const isSubscribed = async (): Promise<boolean> => {
  try {
    return await OneSignal.isPushNotificationsEnabled();
  } catch (error) {
    return false;
  }
};