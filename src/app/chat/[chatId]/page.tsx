// app/chat/[chatId]/page.tsx - FIXED
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { User } from '@/types';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function SpecificChatPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId as string;
  
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  // ✅ FIXED: Fetch other user data with real-time updates
  const fetchOtherUser = useCallback(async (otherUserId: string) => {
    try {
      const userRef = doc(firestore, 'users', otherUserId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        setOtherUser({ 
          id: userSnap.id, 
          uid: userSnap.id,
          email: userData.email || null,
          displayName: userData.displayName || null,
          photoURL: userData.photoURL || null,
          phoneNumber: userData.phoneNumber || null,
          createdAt: userData.createdAt,
          lastSeen: userData.lastSeen,
          isOnline: userData.isOnline || false,
          fcmToken: userData.fcmToken || null,
        } as User);
      } else {
        console.warn('Other user not found:', otherUserId);
        setOtherUser(null);
      }
    } catch (error) {
      console.error('Error fetching other user:', error);
      setOtherUser(null);
    }
  }, []);

  // ✅ FIXED: Improved chat data fetching with real-time listener
  useEffect(() => {
    if (!chatId || !user) {
      setChatLoading(false);
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupChatListener = async () => {
      try {
        setChatLoading(true);
        
        // Get chat document with real-time listener
        const chatRef = doc(firestore, 'chats', chatId);
        
        unsubscribe = onSnapshot(chatRef, async (chatSnap) => {
          if (!chatSnap.exists()) {
            console.error('Chat not found');
            setChatLoading(false);
            return;
          }

          const chatData = chatSnap.data();
          console.log('🔍 Chat data loaded:', chatData);
          
          // Find the other participant
          const otherUserId = chatData.participants?.find((pid: string) => pid !== user.uid);
          
          if (otherUserId) {
            console.log('👤 Found other user ID:', otherUserId);
            await fetchOtherUser(otherUserId);
          } else {
            console.warn('No other participant found in chat');
            setOtherUser(null);
          }
          
          setChatLoading(false);
        }, (error) => {
          console.error('Error in chat listener:', error);
          setChatLoading(false);
        });

      } catch (error) {
        console.error('Error setting up chat listener:', error);
        setChatLoading(false);
      }
    };

    setupChatListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatId, user, fetchOtherUser]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

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

  if (authLoading || chatLoading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 rounded-md hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Chat App</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline">Welcome, {user.displayName || user.email}</span>
            <button
              onClick={handleSignOut}
              className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto h-[calc(100vh-80px)] flex">
        {/* Sidebar */}
        <div className={`
          w-80 lg:w-96 bg-white border-r border-gray-200
          transition-transform duration-300
          md:block
          ${isSidebarOpen ? 'block absolute inset-0 z-50 md:static' : 'hidden md:block'}
        `}>
          <ChatSidebar onSelectChat={handleSelectChat} />
        </div>

        {/* Chat Window */}
        <div className="flex-1 relative">
          <ChatWindow 
            chatId={chatId} 
            otherUser={otherUser} 
            isActive={true}
          />
          
          {/* Loading state for chat window */}
          {chatLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading messages...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}