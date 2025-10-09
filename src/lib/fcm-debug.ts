// lib/fcm-debug.ts - SIMPLE DEBUG FILE
class FCMDebug {
  static enableDebug() {
    console.log('🔔 [FCM DEBUG] Debug mode enabled');
    
    // Service Worker Messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📱 [FCM SW] Message from Service Worker:', event.data);
      });
    }

    // Foreground Messages
    if (typeof window !== 'undefined') {
      // Listen for custom FCM events
      window.addEventListener('fcm-message', (event: any) => {
        console.log('📱 [FCM FRONT] Foreground Message:', event.detail);
      });

      window.addEventListener('fcm-token', (event: any) => {
        console.log('🔑 [FCM TOKEN] Token Received:', event.detail);
      });

      // Override console.log to catch FCM logs
      const originalLog = console.log;
      console.log = function(...args) {
        if (args[0] && typeof args[0] === 'string' && 
            (args[0].includes('FCM') || args[0].includes('notification'))) {
          originalLog('🎯 [FCM CAPTURED]', ...args);
        }
        originalLog.apply(console, args);
      };
    }
  }

  static log(message: string, data?: any) {
    console.log(`🔔 [FCM] ${message}`, data || '');
  }

  static error(message: string, error?: any) {
    console.error(`❌ [FCM ERROR] ${message}`, error || '');
  }

  static success(message: string, data?: any) {
    console.log(`✅ [FCM SUCCESS] ${message}`, data || '');
  }
}

export default FCMDebug;