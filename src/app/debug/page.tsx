// --- path: /src/app/debug/page.tsx ---
'use client';

import { useEffect, useState } from 'react';

export default function DebugPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});

  useEffect(() => {
    // Check which environment variables are available
    const vars = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'NOT_FOUND',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'NOT_FOUND',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT_FOUND',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'NOT_FOUND',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'NOT_FOUND',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'NOT_FOUND',
    };
    setEnvVars(vars);
    //console.log('Environment Variables:', vars);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold mb-6">Firebase Debug Info</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Environment Variables:</h2>
        <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-auto">
          {JSON.stringify(envVars, null, 2)}
        </pre>
        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded">
          <p className="font-semibold">Check the browser console for more detailed logs.</p>
        </div>
      </div>
    </div>
  );
}