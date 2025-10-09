// components/onesignal/NotificationTester.tsx
'use client';

import { useState, useEffect } from 'react';
import { OneSignalService } from '@/lib/onesignal-service';

export default function NotificationTester() {
  const [permission, setPermission] = useState<boolean>(false);
  const [playerId, setPlayerId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    const hasPermission = await OneSignalService.getPermissionStatus();
    setPermission(hasPermission);
    
    const id = await OneSignalService.getPlayerId();
    setPlayerId(id || 'Not available');
  };

  const requestPermission = async () => {
    setIsLoading(true);
    const granted = await OneSignalService.requestPermission();
    setPermission(granted);
    
    // Refresh player ID
    const id = await OneSignalService.getPlayerId();
    setPlayerId(id || 'Not available');
    setIsLoading(false);
  };

  const sendTestNotification = async () => {
    setIsLoading(true);
    const result = await OneSignalService.sendTestNotification(
      'Test Notification 🎉',
      'This is a test notification from your chat app!',
      { test: true, timestamp: new Date().toISOString() }
    );
    setTestResults(result);
    setIsLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">OneSignal Test</h2>
      
      <div className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="font-medium">Notification Permission:</span>
          <span className={`px-2 py-1 rounded text-sm font-medium ${
            permission ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {permission ? 'Granted ✅' : 'Denied ❌'}
          </span>
        </div>

        {/* Player ID */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="font-medium mb-1">Player ID:</div>
          <code className="text-xs bg-gray-100 p-2 rounded break-all block">
            {playerId}
          </code>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {!permission && (
            <button
              onClick={requestPermission}
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Requesting...' : 'Enable Notifications'}
            </button>
          )}

          {permission && (
            <button
              onClick={sendTestNotification}
              disabled={isLoading}
              className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {isLoading ? 'Sending...' : 'Send Test Notification'}
            </button>
          )}

          <button
            onClick={checkPermissionStatus}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
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

        {/* Instructions */}
        <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-medium text-yellow-800 mb-2">Testing Instructions:</h3>
          <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
            <li>Click "Enable Notifications" to allow browser notifications</li>
            <li>Click "Send Test Notification" to test push notifications</li>
            <li>Check your system/browser for the test notification</li>
            <li>Click the notification to test navigation</li>
          </ol>
        </div>
      </div>
    </div>
  );
}