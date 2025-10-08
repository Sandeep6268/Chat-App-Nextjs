// --- path: /src/app/chat/[chatId]/page.tsx ---
'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Chat, User } from '@/types';
import ChatSidebar from '@/components/chat/ChatSidebar';
import ChatWindow from '@/components/chat/ChatWindow';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import toast from 'react-hot-toast';

export default function SpecificChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const chatId = params.chatId as string;
  
  const [chat, setChat] = useState<Chat | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [chatLoading, setChatLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On mobile, hide sidebar by default when in chat view
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch chat data and other user info
  useEffect(() => {
    const fetchChatData = async () => {
      if (!chatId || !user) return;

      try {
        setChatLoading(true);
        
        // Get chat document
        const chatRef = doc(firestore, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        
        if (!chatSnap.exists()) {
          console.error('Chat not found');
          return;
        }

        const chatData = { id: chatSnap.id, ...chatSnap.data() } as Chat;
        setChat(chatData);

        // Find the other participant
        const otherUserId = chatData.participants.find(pid => pid !== user.uid);
        if (otherUserId) {
          const userRef = doc(firestore, 'users', otherUserId);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setOtherUser({ id: userSnap.id, ...userSnap.data() } as User);
          }
        }
      } catch (error) {
        console.error('Error fetching chat data:', error);
      } finally {
        setChatLoading(false);
      }
    };

    fetchChatData();
  }, [chatId, user]);

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

  // Close sidebar when chat is selected on mobile
  const handleSelectChat = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  if (loading || chatLoading) {
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
    <div className="min-h-screen bg-green-50 flex flex-col">
      {/* Fixed Header */}
      <header className="bg-green-600 text-white p-4 fixed top-0 left-0 right-0 z-50 shadow-lg">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            {/* Hamburger icon for mobile */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">Chat App</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline text-sm md:text-base">
              Welcome, {user.displayName || user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="bg-green-700 hover:bg-green-800 px-3 py-1 rounded text-sm transition-colors whitespace-nowrap"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content with padding for fixed header */}
      <main className="flex-1 flex pt-16"> {/* pt-16 for header height */}
        {/* Sidebar - Always visible on desktop, toggleable on mobile */}
        <div className={`
          w-80 lg:w-96 bg-white border-r border-gray-200
          transition-transform duration-300
          md:block
          ${isSidebarOpen ? 'block fixed inset-0 z-40 mt-16 md:static md:mt-0' : 'hidden md:block'}
        `}>
          <ChatSidebar onSelectChat={handleSelectChat} />
        </div>

        {/* Chat Window */}
        <div className="flex-1 relative">
          <ChatWindow chatId={chatId} otherUser={otherUser} />
          
          {/* Overlay for mobile sidebar */}
          {isMobile && isSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </div>
      </main>
    </div>
  );
}