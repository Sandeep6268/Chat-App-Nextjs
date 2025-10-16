// app/chat/page.tsx - FIXED
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSelectChat = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-green-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-green-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <h1 className="text-xl font-bold">Chat App</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline text-sm md:text-base">
              Welcome, {user.displayName || user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="h-[calc(100vh-80px)] flex relative">
        {/* Sidebar */}
        <div className={`
          ${isSidebarOpen ? 'block' : 'hidden'} 
          ${isMobile ? 'absolute inset-0 z-50 w-full' : 'w-full md:w-80 lg:w-96'}
          bg-white border-r border-gray-200
        `}>
          <ChatSidebar onSelectChat={handleSelectChat} />
        </div>

        {/* Chat Window - Empty State */}
        <div className={`
          flex-1
          ${isMobile && isSidebarOpen ? 'hidden' : 'block'}
        `}>
          <ChatWindow chatId="" otherUser={null} isActive={false} />
          
          {/* Back Button for Mobile - Only show when sidebar is closed */}
          {isMobile && !isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="md:hidden absolute top-4 left-4 p-2 bg-green-600 text-white rounded-full shadow-lg z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}