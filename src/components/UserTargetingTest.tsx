// components/UserTargetingTest.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function UserTargetingTest() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('Test user targeting...');

  const testUserTargeting = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setStatus('Testing user targeting...');

      // Test 1: Send to specific user (should only come to you)
      const response = await fetch('/api/send-user-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '🎯 USER TARGET TEST',
          message: 'This should ONLY appear for YOU! If others get it, targeting is broken.',
          userId: user.uid,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ User-targeted test sent! Check if ONLY you received it.');
        console.log('User target test result:', result);
      } else {
        throw new Error(result.error || 'Failed to send');
      }
    } catch (error: any) {
      setStatus(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testBroadcast = async () => {
    try {
      setLoading(true);
      setStatus('Testing broadcast...');

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '📢 BROADCAST TEST',
          message: 'This should go to ALL subscribed users',
          // No userId = broadcast
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setStatus('✅ Broadcast test sent! Should go to all users.');
      } else {
        throw new Error(result.error || 'Failed to send');
      }
    } catch (error: any) {
      setStatus(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto mt-4 border-2 border-purple-400">
      <h3 className="text-lg font-semibold mb-4 text-purple-600">🎯 User Targeting Test</h3>
      
      <div className="space-y-3">
        <button
          onClick={testUserTargeting}
          disabled={loading || !user}
          className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          Test User Targeting (Only You)
        </button>

        <button
          onClick={testBroadcast}
          disabled={loading}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          Test Broadcast (All Users)
        </button>

        <div className="p-3 bg-purple-50 rounded border border-purple-200">
          <p className="text-sm text-purple-700 text-center">
            {status}
          </p>
        </div>

        <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
          <p className="text-xs text-yellow-700">
            <strong>Expected:</strong><br/>
            • User Target → Only YOU get notification<br/>
            • Broadcast → ALL 3 users get notification
          </p>
        </div>
      </div>
    </div>
  );
}