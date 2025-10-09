// components/onesignal/NotificationTester.tsx - FIXED
'use client';

import { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal';
import { OneSignalService } from '@/lib/onesignal-service';

export default function NotificationTester() {
  const [permission, setPermission] = useState<boolean>(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    checkOneSignalStatus();
    addDebugInfo('Component mounted');
  }, []);

  const checkOneSignalStatus = async () => {
    try {
      addDebugInfo('Checking OneSignal status...');
      
      // CORRECTED: Get permission status
      const hasPermission = await OneSignal.Notifications.getPermission();
      setPermission(hasPermission === 'granted');
      addDebugInfo(`Permission status: ${hasPermission}`);
      
      // CORRECTED: Get user ID (player ID)
      const userState = await OneSignal.User.getId();
      const id = userState || '';
      setPlayerId(id || 'Not available');
      addDebugInfo(`Player ID: ${id || 'Not available'}`);

      // CORRECTED: Get subscription status
      const subscriptionState = await OneSignal.User.isSubscribed();
      setIsSubscribed(subscriptionState);
      addDebugInfo(`Subscription status: ${subscriptionState}`);

    } catch (error) {
      addDebugInfo(`Error checking status: ${error}`);
      console.error('Error checking OneSignal status:', error);
    }
  };

  const requestPermission = async () => {
    setIsLoading(true);
    addDebugInfo('Requesting notification permission...');
    
    try {
      // CORRECTED: Use OneSignal's built-in slide-down prompt
      await OneSignal.Slidedown.promptPush();
      
      // Wait a bit and then check status
      setTimeout(async () => {
        await checkOneSignalStatus();
        setIsLoading(false);
      }, 3000);
      
    } catch (error) {
      addDebugInfo(`Permission request error: ${error}`);
      console.error('Error requesting permission:', error);
      setIsLoading(false);
    }
  };

  const manuallyRequestPermission = async () => {
    setIsLoading(true);
    addDebugInfo('Manually requesting permission...');
    
    try {
      // CORRECTED: Use browser's native Notification API as fallback
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult === 'granted');
      addDebugInfo(`Manual permission result: ${permissionResult}`);
      
      if (permissionResult === 'granted') {
        // Refresh OneSignal status
        await checkOneSignalStatus();
      }
    } catch (error) {
      addDebugInfo(`Manual permission error: ${error}`);
      console.error('Error with manual permission:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setIsLoading(true);
    addDebugInfo('Sending test notification...');
    
    try {
      const result = await OneSignalService.sendTestNotification(
        'Test Notification 🎉',
        'This is a test notification from your chat app!',
        { 
          test: true, 
          timestamp: new Date().toISOString(),
          url: window.location.origin
        }
      );
      
      setTestResults(result);
      addDebugInfo(`Test notification sent: ${result ? 'Success' : 'Failed'}`);
    } catch (error) {
      addDebugInfo(`Test notification error: ${error}`);
      console.error('Error sending test notification:', error);
      setTestResults({ error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">OneSignal Test</h2>
      
      <div className="space-y-4">
        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Permission:</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              permission ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {permission ? 'Granted ✅' : 'Denied ❌'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="font-medium">Subscribed:</span>
            <span className={`px-2 py-1 rounded text-sm font-medium ${
              isSubscribed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {isSubscribed ? 'Yes ✅' : 'No ❌'}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium mb-1">Player ID:</div>
            <code className="text-xs bg-gray-100 p-2 rounded break-all block">
              {playerId}
            </code>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {!permission && (
            <>
              <button
                onClick={requestPermission}
                disabled={isLoading}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isLoading ? 'Requesting...' : 'Enable Notifications'}
              </button>
              <button
                onClick={manuallyRequestPermission}
                disabled={isLoading}
                className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
              >
                Manual Request
              </button>
            </>
          )}

          {permission && (
            <button
              onClick={sendTestNotification}
              disabled={isLoading || !playerId}
              className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send Test Notification'}
            </button>
          )}

          <button
            onClick={checkOneSignalStatus}
            className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Refresh Status
          </button>
        </div>

        {/* Test Results */}
        {testResults && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="font-medium mb-1">Test Results:</div>
            <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}

        {/* Debug Information */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Debug Information:</h3>
            <button
              onClick={clearDebugInfo}
              className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
            >
              Clear
            </button>
          </div>
          <div className="text-xs bg-white p-2 rounded overflow-auto max-h-32 font-mono">
            {debugInfo.length === 0 ? (
              <div className="text-gray-500">No debug information yet...</div>
            ) : (
              debugInfo.map((info, index) => (
                <div key={index} className="border-b border-gray-100 py-1">
                  {info}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Troubleshooting Tips */}
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-medium text-yellow-800 mb-2">Troubleshooting Tips:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Make sure your browser allows notifications for this site</li>
            <li>• Check if OneSignal App ID is correctly configured</li>
            <li>• Try refreshing the page if permissions don't update</li>
            <li>• Test in incognito mode to rule out browser extensions</li>
            <li>• Check browser console (F12) for any error messages</li>
            <li>• Ensure you're using HTTPS in production</li>
          </ul>
        </div>
      </div>
    </div>
  );
}