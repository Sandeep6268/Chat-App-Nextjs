'use client';
import { useState, useEffect } from 'react';
import { messaging, getToken } from './firebase-config';

interface TestResult {
  type: 'success' | 'error' | 'info';
  message: string;
  timestamp: Date;
}

export default function FCMTester() {
  const [token, setToken] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [customTitle, setCustomTitle] = useState<string>('📱 Mobile Test Notification');
  const [customBody, setCustomBody] = useState<string>('This is a test from FCM Mobile Tester');

  const addTestResult = (type: TestResult['type'], message: string) => {
    setTestResults(prev => [...prev, { type, message, timestamp: new Date() }]);
  };

  useEffect(() => {
      if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered:', registration);
        addTestResult('success', '✅ Service Worker registered');
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
        addTestResult('error', '❌ Service Worker failed');
      });
  }
    checkPermissions();
  }, []);

  const checkPermissions = () => {
    setPermission(Notification.permission);
    addTestResult('info', `Notification permission: ${Notification.permission}`);
  };

  const requestNotificationPermission = async (): Promise<void> => {
    try {
      setIsLoading(true);
      addTestResult('info', 'Requesting notification permission...');
      
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult === 'granted') {
        addTestResult('success', '✅ Notification permission granted!');
        await getFCMToken();
      } else {
        addTestResult('error', '❌ Notification permission denied');
      }
    } catch (error) {
      addTestResult('error', `❌ Permission error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getFCMToken = async (): Promise<void> => {
    if (!messaging) {
      addTestResult('error', '❌ FCM not supported in this environment');
      setIsSupported(false);
      return;
    }

    try {
      setIsLoading(true);
      addTestResult('info', 'Generating FCM token...');
      
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      
      if (currentToken) {
        setToken(currentToken);
        addTestResult('success', '✅ FCM token generated successfully!');
        addTestResult('info', `Token: ${currentToken.substring(0, 50)}...`);
        
        // Save token to localStorage for testing
        localStorage.setItem('fcm_mobile_test_token', currentToken);
      } else {
        addTestResult('error', '❌ No token received from FCM');
      }
    } catch (error) {
      addTestResult('error', `❌ Token generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // In FCMTester.tsx - sendTestNotification function को replace करें
// FCMTester.tsx - sendTestNotification function
const sendTestNotification = async (): Promise<void> => {
  try {
    setIsLoading(true);
    addTestResult('info', 'Testing API...');

    const response = await fetch('/api/fcm-mobile-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: "test-token",
        title: "Test",
        body: "Test"
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      addTestResult('success', '✅ API Working! Test passed');
    } else {
      addTestResult('error', '❌ API Failed');
    }

  } catch (error: any) {
    addTestResult('error', '❌ Network error');
  } finally {
    setIsLoading(false);
  }
};

  const copyTokenToClipboard = (): void => {
    navigator.clipboard.writeText(token);
    addTestResult('success', '📋 Token copied to clipboard!');
  };

  const clearResults = (): void => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📱 FCM Mobile Tester
          </h1>
          <p className="text-gray-600">
            Test Firebase Cloud Messaging on your mobile device
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${
            permission === 'granted' ? 'bg-green-50 border-green-200' : 
            permission === 'denied' ? 'bg-red-50 border-red-200' : 
            'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="font-semibold">🔔 Permission Status</div>
            <div className={`font-bold ${
              permission === 'granted' ? 'text-green-700' : 
              permission === 'denied' ? 'text-red-700' : 
              'text-yellow-700'
            }`}>
              {permission.toUpperCase()}
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            token ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
          }`}>
            <div className="font-semibold">🔑 Token Status</div>
            <div className={token ? 'text-green-700 font-bold' : 'text-gray-700'}>
              {token ? 'GENERATED' : 'NOT GENERATED'}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🚀 Test Controls</h2>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={requestNotificationPermission}
                disabled={isLoading || permission === 'granted'}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {permission === 'granted' ? '✅ Permission Granted' : '1. Request Permission'}
              </button>

              <button
                onClick={getFCMToken}
                disabled={isLoading || permission !== 'granted' || !!token}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {token ? '✅ Token Generated' : '2. Get FCM Token'}
              </button>

              <button
                onClick={checkPermissions}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                🔄 Refresh Status
              </button>
            </div>

            {/* Custom Message Inputs */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">✏️ Custom Message</h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Notification title"
                  className="w-full p-2 border rounded-lg"
                />
                <textarea
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  placeholder="Notification body"
                  className="w-full p-2 border rounded-lg h-20"
                />
              </div>
            </div>

            {/* Send Test Button */}
            <button
              onClick={sendTestNotification}
              disabled={isLoading || !token}
              className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold text-lg"
            >
              {isLoading ? '⏳ Sending...' : '📤 Send Test Notification'}
            </button>
          </div>
        </div>

        {/* Token Display */}
        {token && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">🔑 FCM Token</h3>
              <button
                onClick={copyTokenToClipboard}
                className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
              >
                📋 Copy
              </button>
            </div>
            <textarea
              readOnly
              value={token}
              className="w-full h-24 p-2 bg-white border rounded text-sm font-mono"
            />
            <p className="text-sm text-gray-600 mt-2">
              This token is saved in localStorage for testing
            </p>
          </div>
        )}

        {/* Test Results */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">📊 Test Results</h2>
            <button
              onClick={clearResults}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              🗑️ Clear
            </button>
          </div>
          
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No test results yet. Start testing above.</p>
            ) : (
              testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded border ${
                    result.type === 'success' ? 'bg-green-50 border-green-200' :
                    result.type === 'error' ? 'bg-red-50 border-red-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex justify-between">
                    <span>{result.message}</span>
                    <span className="text-sm text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mobile Testing Tips */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">📱 Mobile Testing Tips</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Open this page on your mobile browser</li>
            <li>• Allow notification permissions when prompted</li>
            <li>• Minimize browser or open another tab after sending test</li>
            <li>• Check both foreground and background notifications</li>
            <li>• Ensure service worker is properly installed</li>
          </ul>
        </div>
      </div>
    </div>
  );
}