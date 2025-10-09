// components/TestNotificationFinal.tsx - FIXED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function TestNotificationFinal() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Ready to test...');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [oneSignalLoaded, setOneSignalLoaded] = useState(false);

  useEffect(() => {
    initializeOneSignalSafely();
    checkEnvironment();
  }, [user]);

  // Safe OneSignal Initialization
  const initializeOneSignalSafely = async () => {
    if (typeof window === 'undefined') return;

    try {
      // Check if OneSignal is already loaded properly
      if (window.OneSignal && window.OneSignal.init) {
        setOneSignalLoaded(true);
        setStatus('✅ OneSignal already loaded');
        return;
      }

      // Load OneSignal with error handling
      await loadOneSignalScript();
      
    } catch (error) {
      console.log('OneSignal loading failed, using fallback method');
      setStatus('⚠️ OneSignal loading issue, using API method');
    }
  };

  // Safe OneSignal Script Loading
  const loadOneSignalScript = () => {
    return new Promise((resolve, reject) => {
      // Check if script already exists
      if (document.querySelector('script[src*="onesignal"]')) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.async = true;
      
      script.onload = () => {
        console.log('✅ OneSignal script loaded');
        
        // Wait a bit for OneSignal to initialize
        setTimeout(() => {
          if (window.OneSignal && typeof window.OneSignal.init === 'function') {
            initializeOneSignalCore();
            setOneSignalLoaded(true);
            resolve(true);
          } else {
            reject(new Error('OneSignal not available after loading'));
          }
        }, 1000);
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load OneSignal script');
        reject(new Error('Script loading failed'));
      };
      
      document.head.appendChild(script);
    });
  };

  // Core OneSignal Initialization
  const initializeOneSignalCore = () => {
    try {
      window.OneSignal = window.OneSignal || [];
      
      window.OneSignal.push(function() {
        window.OneSignal.init({
          appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
          allowLocalhostAsSecureOrigin: true,
          serviceWorkerParam: { scope: '/onesignal/' },
          serviceWorkerPath: 'OneSignalSDKWorker.js',
          promptOptions: {
            slidedown: {
              enabled: true,
              autoPrompt: false,
            }
          }
        });

        console.log('✅ OneSignal core initialized');
        
        // Set user ID
        if (user?.uid) {
          window.OneSignal.setExternalUserId(user.uid);
        }
      });
    } catch (error) {
      console.error('OneSignal core init error:', error);
    }
  };

  const checkEnvironment = async () => {
    const info: any = {};

    try {
      // Check server environment
      const envResponse = await fetch('/api/test-onesignal');
      const serverEnv = await envResponse.json();
      info.serverCheck = serverEnv;

      // Check browser support
      info.browserSupport = typeof window !== 'undefined';
      info.notificationSupport = 'Notification' in window;
      info.permission = Notification.permission;
      info.oneSignalLoaded = oneSignalLoaded;

      // Check user
      info.user = user ? `✅ ${user.email}` : '❌ Not logged in';

      setDebugInfo(info);

      if (serverEnv.hasApiKey && serverEnv.hasAppId) {
        setStatus('✅ Server ready! You can test notifications.');
      }

    } catch (error) {
      console.error('Environment check error:', error);
    }
  };

  // Method 1: Direct API Call (Most Reliable)
  const sendTestViaAPI = async () => {
    if (!user) {
      setStatus('❌ Please login first');
      return;
    }

    try {
      setLoading(true);
      setStatus('Sending test notification via API...');

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test from Chat App 🔔',
          message: 'Hello! This is a test notification sent via API.',
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ Notification sent via API! Check your notifications.');
        console.log('API Response:', result);
        
        // Update debug info
        setDebugInfo(prev => ({
          ...prev,
          lastNotification: {
            method: 'API',
            success: true,
            response: result
          }
        }));
      } else {
        throw new Error(result.error || 'API request failed');
      }
    } catch (error: any) {
      console.error('API notification error:', error);
      setStatus(`❌ API Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Method 2: OneSignal SDK (if available)
  const sendTestViaOneSignal = async () => {
    if (!oneSignalLoaded || !window.OneSignal) {
      setStatus('❌ OneSignal not loaded, using API method instead');
      sendTestViaAPI();
      return;
    }

    try {
      setLoading(true);
      setStatus('Sending via OneSignal SDK...');

      // This is how you'd send via OneSignal SDK directly
      // But API method is more reliable for our use case
      setStatus('⚠️ Using API method instead (more reliable)');
      sendTestViaAPI();
      
    } catch (error: any) {
      console.error('OneSignal SDK error:', error);
      setStatus(`❌ OneSignal SDK failed: ${error.message}`);
      setLoading(false);
    }
  };

  // Check notification permission
  const requestPermission = async () => {
    try {
      setLoading(true);
      setStatus('Requesting notification permission...');

      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        setStatus('✅ Notification permission granted!');
        checkEnvironment();
      } else {
        setStatus('❌ Notification permission denied');
      }
    } catch (error: any) {
      setStatus(`❌ Permission error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Test different notification types
  const testDifferentNotifications = async () => {
    if (!user) {
      setStatus('❌ Please login first');
      return;
    }

    const tests = [
      { title: 'Test 1: Simple', message: 'This is a simple test notification' },
      { title: 'Test 2: Chat Message', message: 'You have a new message in chat!' },
      { title: 'Test 3: Urgent 🔔', message: 'Important: Test notification' }
    ];

    setLoading(true);
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      setStatus(`Sending test ${i + 1}/3: ${test.title}`);
      
      try {
        await fetch('/api/send-notification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...test,
            userId: user.uid,
          }),
        });
        
        // Wait 2 seconds between tests
        if (i < tests.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`Test ${i + 1} failed:`, error);
      }
    }
    
    setStatus('✅ All test notifications sent! Check your notifications.');
    setLoading(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto mt-8 border-2 border-blue-200">
      <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">
        🔔 Notification Test - SIMPLE & STABLE
      </h2>

      {/* Status */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold mb-2 text-blue-800">Status:</h3>
        <p className={`text-sm font-medium ${
          status.includes('✅') ? 'text-green-600' : 
          status.includes('❌') ? 'text-red-600' : 'text-blue-600'
        }`}>
          {status}
        </p>
        {oneSignalLoaded && (
          <p className="text-green-600 text-sm mt-1">✅ OneSignal Loaded</p>
        )}
      </div>

      {/* Debug Info */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Debug Information:</h3>
        <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-40">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Test Buttons */}
      <div className="space-y-3 mb-6">
        <button
          onClick={sendTestViaAPI}
          disabled={loading || !user}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors font-semibold"
        >
          🚀 SEND TEST NOTIFICATION (API)
        </button>

        <button
          onClick={testDifferentNotifications}
          disabled={loading || !user}
          className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          Send Multiple Test Notifications
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={requestPermission}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
          >
            Request Permission
          </button>

          <button
            onClick={checkEnvironment}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Refresh Status
          </button>
        </div>
      </div>

      {/* Information */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">🎯 What's Happening:</h3>
        <div className="text-sm text-green-700 space-y-1">
          <p>• We're using <strong>direct API calls</strong> to OneSignal (most reliable)</p>
          <p>• OneSignal SDK is optional for this approach</p>
          <p>• Notifications should work even with SDK errors</p>
          <p className="font-semibold mt-2">👉 Click "SEND TEST NOTIFICATION" to test!</p>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h3 className="font-semibold text-yellow-800 mb-2">🔧 If Notifications Don't Work:</h3>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Check browser notification permissions</li>
          <li>Look for errors in browser console (F12)</li>
          <li>Check OneSignal Dashboard for delivery status</li>
          <li>Ensure you're using HTTPS</li>
        </ol>
      </div>
    </div>
  );
}