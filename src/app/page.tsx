// src/app/page.tsx
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/chat');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">
          Chat App
        </h1>
        <p className="text-gray-600 mb-6">
          Built with Next.js, TypeScript, and Firebase
        </p>
        <div className="space-y-3">
          <Link 
            href="/auth/login" 
            className="block w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/signup" 
            className="block w-full bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 transition"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}
