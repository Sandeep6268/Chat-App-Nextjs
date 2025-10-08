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
    <div className="min-h-screen bg-green-50">
      <header className="bg-green-600 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Chat App</h1>
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
        <ChatSidebar />
        <ChatWindow chatId={chatId} otherUser={otherUser} />
      </main>
    </div>
  );
}