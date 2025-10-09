// lib/universal-notifications.ts - PURE FCM ONLY
import { DeviceUtils } from './device-utils';
import { FCMService } from './fcm-service';

export class UniversalNotificationService {
  private static fcmInitialized = false;

  // Initialize FCM for user
  static async initializeFCM(userId: string): Promise<boolean> {
    console.log('🎯 [FCM SETUP] Starting FCM initialization for user:', userId);
    
    if (this.fcmInitialized) {
      console.log('✅ [FCM SETUP] FCM already initialized');
      return true;
    }

    // Check if mobile device
    if (!DeviceUtils.isMobile()) {
      console.log('💻 [FCM SETUP] Desktop device - FCM not needed');
      return false;
    }

    console.log('📱 [FCM SETUP] Mobile device detected - proceeding with FCM');

    // Check FCM support
    const isSupported = await FCMService.isSupported();
    if (!isSupported) {
      console.error('❌ [FCM SETUP] FCM not supported on this device/browser');
      return false;
    }

    try {
      console.log('🚀 [FCM SETUP] Requesting FCM permission and token...');
      const token = await FCMService.requestPermission(userId);
      
      if (token) {
        console.log('✅ [FCM SETUP] FCM initialized successfully');
        
        // Setup message listener
        FCMService.onMessage((payload) => {
          console.log('📨 [FCM MESSAGE] Message received via FCM:', {
            title: payload.notification?.title,
            body: payload.notification?.body,
            data: payload.data
          });
        });

        this.fcmInitialized = true;
        return true;
      } else {
        console.error('❌ [FCM SETUP] FCM initialization failed - no token received');
        return false;
      }
    } catch (error) {
      console.error('💥 [FCM SETUP] FCM initialization error:', error);
      return false;
    }
  }

  // Main notification function - ONLY FCM
  static async sendNotification(
    senderName: string, 
    message: string, 
    targetUserId: string, 
    chatId: string
  ) {
    console.log('🔔 [NOTIFICATION] Sending via FCM:', {
      from: senderName,
      to: targetUserId,
      chat: chatId,
      message: message
    });

    // ONLY USE FCM - no fallbacks, no alternatives
    return await this.sendFCMPushNotification(
      targetUserId,
      senderName,
      message,
      chatId
    );
  }

  // Send FCM Push Notification - ONLY METHOD
  private static async sendFCMPushNotification(
    targetUserId: string,
    senderName: string,
    message: string,
    chatId: string
  ) {
    console.log('🚀 [FCM PUSH] Sending push notification:', {
      targetUserId,
      senderName,
      chatId
    });

    try {
      const payload = {
        targetUserId: targetUserId,
        title: `💬 ${senderName}`,
        body: message,
        data: { 
          chatId: chatId,
          type: 'message',
          senderName: senderName,
          timestamp: new Date().toISOString()
        },
      };

      console.log('📤 [FCM PUSH] API Request payload:', payload);

      const response = await fetch('/api/send-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 [FCM PUSH] API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [FCM PUSH] API Error:', {
          status: response.status,
          error: errorText
        });
        throw new Error(`FCM API Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ [FCM PUSH] API Success:', result);
      
      return { 
        success: true, 
        type: 'fcm_push',
        messageId: result.messageId,
        details: result
      };

    } catch (error: any) {
      console.error('💥 [FCM PUSH] Error:', {
        message: error.message,
        stack: error.stack
      });
      
      return { 
        success: false, 
        type: 'fcm_push',
        error: error.message,
        code: error.code
      };
    }
  }

  // Test FCM functionality
  static async testFCM(userId: string) {
    console.log('🧪 [FCM TEST] Starting FCM test for user:', userId);

    // Step 1: Initialize FCM
    console.log('1️⃣ [FCM TEST] Initializing FCM...');
    const initialized = await this.initializeFCM(userId);
    
    if (!initialized) {
      console.error('❌ [FCM TEST] FCM initialization failed');
      return { success: false, step: 'initialization' };
    }

    // Step 2: Send test notification to self
    console.log('2️⃣ [FCM TEST] Sending test notification...');
    const testResult = await this.sendFCMPushNotification(
      userId, // Send to self for testing
      'FCM Test Bot',
      'This is a test FCM push notification! 🔔 ' + new Date().toLocaleTimeString(),
      'test-chat-' + Date.now()
    );

    console.log('📊 [FCM TEST] Test result:', testResult);
    
    // Step 3: Show test summary
    const testSummary = {
      success: testResult.success,
      steps: {
        initialization: initialized,
        notification_sent: testResult.success,
        message_id: testResult.messageId
      },
      details: testResult
    };

    console.log('📋 [FCM TEST] Test summary:', testSummary);
    
    // Show alert with test results
    if (typeof window !== 'undefined') {
      if (testResult.success) {
        alert(`✅ FCM TEST SUCCESSFUL!\n\nCheck console for details and wait for push notification.`);
      } else {
        alert(`❌ FCM TEST FAILED!\n\nError: ${testResult.error}\n\nCheck console for details.`);
      }
    }

    return testSummary;
  }

  // Get FCM status
  static getFCMStatus() {
    const status = {
      fcmInitialized: this.fcmInitialized,
      isMobile: DeviceUtils.isMobile(),
      notificationPermission: Notification.permission,
      supportsNotifications: 'Notification' in window,
      supportsServiceWorker: 'serviceWorker' in navigator,
      userAgent: navigator.userAgent,
      isSecure: window.location.protocol === 'https:'
    };

    console.log('📊 [FCM STATUS] Current status:', status);
    return status;
  }

  // Check if user has FCM token
  static async checkUserFCMToken(userId: string): Promise<boolean> {
    try {
      const db = await import('firebase/firestore');
      const tokenDoc = await db.getDoc(db.doc(db.getFirestore(), 'fcm_tokens', userId));
      return tokenDoc.exists() && !!tokenDoc.data()?.token;
    } catch (error) {
      console.error('❌ [FCM] Error checking user token:', error);
      return false;
    }
  }
}