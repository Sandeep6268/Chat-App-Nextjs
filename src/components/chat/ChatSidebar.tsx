// components/chat/ChatSidebar.tsx - EXTRA DEBUG LOGS
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { usePathname, useRouter } from 'next/navigation';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { User, Chat } from '@/types';
import { getUserChats, markAllMessagesAsRead } from '@/lib/firestore';
import toast from 'react-hot-toast';
import { sendPushNotification } from '@/lib/notifications';

interface ChatSidebarProps {
  onSelectChat?: () => void;
}

export default function ChatSidebar({ onSelectChat }: ChatSidebarProps) {
  const { user } = useAuth();
  
  const pathname = usePathname();
  const router = useRouter();
  
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [existingChats, setExistingChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState<number>(0);
  const [usersWithoutChats, setUsersWithoutChats] = useState<User[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Refs to track previous values for notification logic
  const previousChatsRef = useRef<Chat[]>([]);
  const previousTotalUnreadRef = useRef<number>(0);
  const notificationCooldownRef = useRef<{[key: string]: number}>({});

  // Get current chat ID from URL
  const currentChatId = pathname?.split('/chat/')[1];

  // Add debug logs at component start
  console.log('🚀 ChatSidebar Component Mounted', { 
    user: user?.uid, 
    currentChatId,
    pathname 
  });

 

  // ✅ DEBUG: Updated useEffect with detailed logging
useEffect(() => {
  console.log('🔄 ChatSidebar useEffect triggered', { user: user?.uid });

  if (!user) {
    console.log('❌ No user found, skipping setup');
    return;
  }

  let unsubscribeChats: (() => void) | undefined;

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('📥 Starting data fetch...');
      
      // Fetch users
      const usersRef = collection(firestore, 'users');
      const usersQuery = query(usersRef, where('uid', '!=', user.uid));
      const usersSnapshot = await getDocs(usersQuery);
      
      const allUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        uid: doc.data().uid || doc.id,
        email: doc.data().email || null,
        displayName: doc.data().displayName || null,
        photoURL: doc.data().photoURL || null,
        phoneNumber: doc.data().phoneNumber || null,
        createdAt: doc.data().createdAt,
        lastSeen: doc.data().lastSeen,
        isOnline: doc.data().isOnline || false,
        fcmToken: doc.data().fcmToken || null, // Added FCM token
      } as User));
      
      setAvailableUsers(allUsers);
      console.log(`👥 Found ${allUsers.length} other users:`, allUsers.map(u => u.displayName));
      
      // Real-time chats listener
      unsubscribeChats = getUserChats(user.uid, (chats) => {
        console.log('💬 Chats updated:', chats.length, 'chats found');
        
        const userChats = chats.filter(chat => 
          chat.participants && chat.participants.includes(user.uid)
        );
        
        console.log(`📋 Filtered to ${userChats.length} user chats`);
        
        // Calculate total unread
        const totalUnreadMessages = userChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        const previousTotal = previousTotalUnreadRef.current;
        
        console.log(`📊 Unread count: ${previousTotal} → ${totalUnreadMessages}`);
        
        // 🚨 FIXED: Send notification for EACH new unread message
        if (totalUnreadMessages > previousTotal && previousTotal >= 0) {
          const increasedBy = totalUnreadMessages - previousTotal;
          console.log(`🎯 Unread count increased by ${increasedBy}! Checking for notifications...`);
          
          // Find ALL chats with new unread messages
          userChats.forEach(async (chat) => {
            const previousChat = previousChatsRef.current.find(c => c.id === chat.id);
            const previousUnread = previousChat?.unreadCount || 0;
            const currentUnread = chat.unreadCount || 0;
            
            console.log(`🔍 Chat ${chat.id}: ${previousUnread} → ${currentUnread} unread`);
            
            // 🚨 FIXED: Send notification for EVERY new unread message
            if (currentUnread > previousUnread) {
              const otherUserInfo = getOtherUserInfo(chat);
              const newMessagesCount = currentUnread - previousUnread;
              
              console.log(`🎯 Chat ${chat.id} has ${newMessagesCount} new unread messages!`);
              
              // 🚨 REMOVED COOLDOWN: Send notification immediately for each new message
              // Get the other user ID (the one who should receive notification)
              const otherUserId = chat.participants?.find(pid => pid !== user.uid);
              
              if (otherUserId && newMessagesCount > 0) {
                try {
                  // Check if user is not currently viewing this chat
                  const isUserViewingThisChat = currentChatId === chat.id;
                  const isWindowFocused = document.hasFocus();
                  
                  // Only send notification if:
                  // 1. User is NOT viewing this specific chat OR
                  // 2. Window is not focused (minimized or another tab)
                  if (!isUserViewingThisChat || !isWindowFocused) {
                    console.log(`📱 Sending push notification to ${otherUserId}`);
                    
                    // Import and send push notification
                    const { sendPushNotification } = await import('@/lib/notifications');
                    
                    const notificationPayload = {
                      title: `New message from ${otherUserInfo.name}`,
                      body: chat.lastMessage || 'You have a new message',
                      chatId: chat.id,
                      senderName: otherUserInfo.name,
                      message: chat.lastMessage || 'New message'
                    };
                    
                    // Send notification to the user who has unread messages
                    await sendPushNotification(otherUserId, notificationPayload);
                    
                    console.log(`✅ Push notification sent to ${otherUserId}`);
                  } else {
                    console.log(`ℹ️ Skipping notification - user is viewing chat ${chat.id}`);
                  }
                } catch (error) {
                  console.error('❌ Error sending push notification:', error);
                }
              }
            }
          });
        } else {
          console.log('ℹ️ No unread count increase detected');
        }
        
        // Update state
        previousTotalUnreadRef.current = totalUnreadMessages;
        previousChatsRef.current = userChats;
        setTotalUnread(totalUnreadMessages);
        setExistingChats(userChats);
        
        console.log('✅ State updated with new chats');
        
        // Calculate users without chats
        const usersWithExistingChats = new Set<string>();
        userChats.forEach(chat => {
          chat.participants?.filter(pid => pid !== user.uid).forEach(pid => {
            usersWithExistingChats.add(pid);
          });
        });
        
        const usersWithoutExistingChats = allUsers.filter(user => 
          !usersWithExistingChats.has(user.uid)
        );
        
        setUsersWithoutChats(usersWithoutExistingChats);
        console.log(`👥 Users without chats: ${usersWithoutExistingChats.length}`);
      });
      
    } catch (error) {
      console.error('❌ Error in fetchData:', error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();

  return () => {
    if (unsubscribeChats) {
      unsubscribeChats();
    }
  };
}, [user, currentChatId]);

  // Get other user's info from chat
 // In ChatSidebar.tsx - IMPROVE getOtherUserInfo
const getOtherUserInfo = (chat: Chat) => {
  if (!user) return { name: 'Unknown User', email: '', photoURL: null, uid: '' };
  
  const otherParticipants = chat.participants?.filter(pid => pid !== user.uid) || [];
  
  if (otherParticipants.length === 0) {
    return { name: 'Unknown User', email: '', photoURL: null, uid: '' };
  }
  
  const otherUserId = otherParticipants[0];
  const otherUser = availableUsers.find(u => u.uid === otherUserId);
  
  console.log('🔍 Finding user info:', { otherUserId, otherUser, availableUsers });
  
  if (!otherUser) {
    // Try to get from chat participantData if available
    if (chat.participantData && chat.participantData[otherUserId]) {
      return {
        name: chat.participantData[otherUserId].displayName || 'Unknown User',
        email: '',
        photoURL: chat.participantData[otherUserId].photoURL,
        uid: otherUserId
      };
    }
    return { name: 'Unknown User', email: '', photoURL: null, uid: otherUserId };
  }
  
  return {
    name: otherUser.displayName || otherUser.email?.split('@')[0] || 'Unknown User',
    email: otherUser.email || '',
    photoURL: otherUser.photoURL,
    uid: otherUser.uid
  };
};
  // ... (REST OF THE CHATSIDEBAR CODE REMAINS THE SAME - only notification part updated)
  // Filter chats based on search term
  const filteredChats = existingChats.filter(chat => {
    if (!searchTerm) return true;
    
    const otherUserInfo = getOtherUserInfo(chat);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      otherUserInfo.name.toLowerCase().includes(searchLower) ||
      otherUserInfo.email.toLowerCase().includes(searchLower) ||
      chat.lastMessage?.toLowerCase().includes(searchLower)
    );
  });

  // Filter users for new chat modal based on search
  const filteredUsers = usersWithoutChats.filter(otherUser => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      (otherUser.displayName?.toLowerCase().includes(searchLower) || false) ||
      (otherUser.email?.toLowerCase().includes(searchLower) || false)
    );
  });

  // Function to create new chat (one-to-one only)
  const createNewChat = async (otherUserId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { createChat } = await import('@/lib/firestore');
      
      // Create one-to-one chat
      const chatRef = await createChat([user.uid, otherUserId]);
      
      // Close modal after creating chat
      setShowNewChatModal(false);
      setSearchTerm('');
      
      // Close sidebar on mobile
      if (onSelectChat) {
        onSelectChat();
      }
      
      // Navigate to the new chat
      router.push(`/chat/${chatRef.id}`);
      
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error creating chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Improved chat click handler
  const handleChatClick = async (chatId: string, hasUnread: boolean) => {
    // Don't navigate if it's the same chat
    if (chatId === currentChatId) {
      if (onSelectChat) onSelectChat();
      return;
    }

    // Mark messages as read when user clicks on any chat
    if (hasUnread && user) {
      try {
        await markAllMessagesAsRead(chatId, user.uid);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    }
    
    // Navigate to chat
    window.location.href = `/chat/${chatId}`;// Use full reload to ensure state resets
    router.push(`/chat/${chatId}`);
    
    // Close sidebar on mobile when chat is selected
    if (onSelectChat) {
      onSelectChat();
    }
  };

  // Format last message time with better relative timing
  const formatLastMessageTime = (timestamp: { toDate: () => Date } | null) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) return 'now';
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays === 1) return 'yesterday';
      if (diffDays < 7) return `${diffDays}d`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // Truncate long last messages
  const truncateLastMessage = (message: string | undefined, maxLength: number = 40) => {
    if (!message) return 'Start a conversation...';
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  // New Chat Modal Component
  const NewChatModal = () => {
    if (!showNewChatModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
          {/* Modal Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                New Conversation
              </h3>
              <button
                onClick={() => {
                  setShowNewChatModal(false);
                  setSearchTerm('');
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchTerm ? 'No users found' : 'All Caught Up! 🎉'}
                </h4>
                <p className="text-gray-500 text-sm">
                  {searchTerm 
                    ? 'Try adjusting your search terms' 
                    : "You're already chatting with everyone."}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-sm text-gray-600 font-medium">
                    Available Users
                  </p>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                    {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {filteredUsers.map((otherUser) => (
                  <button
                    key={otherUser.uid}
                    onClick={() => createNewChat(otherUser.uid)}
                    disabled={loading}
                    className="w-full flex items-center p-4 rounded-xl bg-white hover:bg-blue-50 transition-all duration-200 border border-gray-200 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {/* User Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                          {otherUser.displayName?.[0]?.toUpperCase() || otherUser.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        {/* Online Status Indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                          otherUser.isOnline ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold text-gray-900 text-base truncate">
                          {otherUser.displayName || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {otherUser.email}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {otherUser.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Add Icon */}
                    <div className="text-blue-500 transform transition-transform group-hover:scale-110 p-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                setShowNewChatModal(false);
                setSearchTerm('');
              }}
              className="w-full px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Chats</h2>
              <p className="text-gray-600 mt-1">Loading conversations...</p>
            </div>
            <div className="animate-pulse">
              <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
        
        {/* Loading State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading your conversations...</p>
            <p className="text-gray-500 text-sm mt-1">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Chats</h2>
              <p className="text-gray-600 mt-1">
                {existingChats.length} conversation{existingChats.length !== 1 ? 's' : ''}
                {totalUnread > 0 && (
                  <span className="ml-2 text-red-600 font-medium">
                    • {totalUnread} unread
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-sm rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 font-bold shadow-sm">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
              {/* New Chat Button */}
              <button
                onClick={() => setShowNewChatModal(true)}
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                title="Start New Chat"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {filteredChats.length > 0 ? (
            <div className="p-3">
              {filteredChats.map((chat) => {
                const unreadCount = chat.unreadCount || 0;
                const hasUnread = unreadCount > 0;
                const isActiveChat = chat.id === currentChatId;
                const otherUserInfo = getOtherUserInfo(chat);
                
                return (
                  <div
                    key={chat.id}
                    className={`block p-4 rounded-2xl mb-2 transition-all duration-200 cursor-pointer group ${
                      isActiveChat 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-[1.02]' 
                        : hasUnread 
                          ? 'bg-orange-50 border border-orange-200 hover:bg-orange-100 hover:shadow-md' 
                          : 'bg-white border border-gray-200 hover:bg-gray-50 hover:shadow-md'
                    }`}
                    onClick={() => handleChatClick(chat.id, hasUnread)}
                  >
                    <div className="flex items-center space-x-4">
                      {/* User Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm ${
                          isActiveChat 
                            ? 'bg-white text-blue-600' 
                            : hasUnread 
                              ? 'bg-gradient-to-br from-green-500 to-green-600' 
                              : 'bg-gradient-to-br from-gray-400 to-gray-500'
                        }`}>
                          {otherUserInfo.photoURL ? (
                            <img 
                              src={otherUserInfo.photoURL} 
                              alt={otherUserInfo.name}
                              className="w-14 h-14 rounded-2xl object-cover"
                            />
                          ) : (
                            otherUserInfo.name[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        {/* Unread Indicator */}
                        {hasUnread && !isActiveChat && (
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white text-xs font-bold">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p className={`font-bold text-base truncate ${
                            isActiveChat ? 'text-white' : 'text-gray-900'
                          }`}>
                            {otherUserInfo.name}
                          </p>
                          {chat.lastMessageTimestamp && (
                            <span className={`text-sm whitespace-nowrap ml-2 ${
                              isActiveChat ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatLastMessageTime(chat.lastMessageTimestamp)}
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm truncate mb-1 ${
                          isActiveChat ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {otherUserInfo.email}
                        </p>
                        
                        <p className={`text-sm truncate font-medium ${
                          isActiveChat 
                            ? 'text-white' 
                            : hasUnread 
                              ? 'text-green-600' 
                              : 'text-gray-600'
                        }`}>
                          {truncateLastMessage(chat.lastMessage, 35)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              {searchTerm ? (
                // No search results
                <div className="text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations found</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    No conversations match "{searchTerm}"
                  </p>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                // No chats at all
                <div className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl mx-auto mb-6 flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">No conversations yet</h3>
                  <p className="text-gray-500 mb-6 max-w-sm">
                    Start your first conversation to begin messaging with other users.
                  </p>
                  
                  {/* Big Plus Button when no chats */}
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 mb-4"
                    title="Start New Chat"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  
                  <p className="text-xs text-gray-400">
                    {usersWithoutChats.length} user{usersWithoutChats.length !== 1 ? 's' : ''} available to chat with
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Current User Info */}
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'}
                  className="w-12 h-12 rounded-2xl object-cover"
                />
              ) : (
                user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {user?.displayName || 'You'}
              </p>
              <p className="text-gray-500 text-xs truncate">
                {user?.email}
              </p>
              <p className="text-green-500 text-xs font-medium mt-1 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Online
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      <NewChatModal />
    </>
  );
}