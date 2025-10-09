// app/test-user-targeting/page.tsx
'use client';

import SimpleNotificationSubscribe from '@/components/SimpleNotificationSubscribe';
import UserTargetingTest from '@/components/UserTargetingTest';

export default function TestUserTargetingPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          🎯 User Targeting Test
        </h1>
        
        {/* Step 1: Subscribe with User Targeting */}
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-green-600">Step 1: Subscribe with User Targeting</h2>
          <SimpleNotificationSubscribe />
        </div>

        {/* Step 2: Test Targeting */}
        <div className="p-4 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-purple-600">Step 2: Test User Targeting</h2>
          <UserTargetingTest />
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-3">📝 Test Instructions:</h3>
          <ol className="list-decimal list-inside text-sm text-blue-700 space-y-2">
            <li><strong>Step 1:</strong> Click "Subscribe + Enable User Targeting" button</li>
            <li><strong>Step 2:</strong> Allow browser notifications when prompted</li>
            <li><strong>Step 3:</strong> Click "Test User Targeting (Only You)" button</li>
            <li><strong>Step 4:</strong> Check if ONLY you receive the notification</li>
            <li><strong>Step 5:</strong> Click "Test Broadcast (All Users)" to compare</li>
          </ol>
        </div>
      </div>
    </div>
  );
}