// components/FCMTestButton.tsx - TEST COMPONENT
'use client';
import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { UniversalNotificationService } from '@/lib/universal-notifications';

export default function FCMTestButton() {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);

  const testFCM = async () => {
    if (!user) {
      alert('Please login first to test FCM');
      return;
    }

    setTesting(true);
    console.clear(); // Clear console for fresh logs
    
    console.log('🧪 ===== FCM COMPLETE TEST STARTED =====');
    
    try {
      const result = await UniversalNotificationService.testFCM(user.uid);
      console.log('📋 ===== FCM TEST COMPLETE =====', result);
    } catch (error) {
      console.error('💥 ===== FCM TEST FAILED =====', error);
    } finally {
      setTesting(false);
    }
  };

  const checkStatus = () => {
    const status = UniversalNotificationService.getFCMStatus();
    console.log('📊 ===== FCM STATUS =====', status);
    alert(`FCM Status:\n\n- FCM Initialized: ${status.fcmInitialized}\n- Mobile: ${status.isMobile}\n- Permission: ${status.notificationPermission}\n- HTTPS: ${status.isSecure}\n\nCheck console for full details.`);
  };

  return (
    <div className="flex gap-2 p-4 bg-gray-100 rounded-lg">
      <button
        onClick={testFCM}
        disabled={testing}
        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {testing ? 'Testing FCM...' : '🧪 Test FCM'}
      </button>
      
      <button
        onClick={checkStatus}
        className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
      >
        📊 Check Status
      </button>
    </div>
  );
}