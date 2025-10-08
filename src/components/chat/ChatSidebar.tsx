// --- path: /src/components/chat/ChatSidebar.tsx ---
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { User, Chat } from '@/types';
import { getUserChats, markAllMessagesAsRead } from '@/lib/firestore';

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

  // Get current chat ID from URL
  const currentChatId = pathname?.split('/chat/')[1];

  // Fetch users and chats
  useEffect(() => {
    if (!user) return;

    let unsubscribeChats: (() => void) | undefined;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all users except current user
        const usersRef = collection(firestore, 'users');
        const usersQuery = query(usersRef, where('uid', '!=', user.uid));
        const usersSnapshot = await getDocs(usersQuery);
        
        const allUsers = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            uid: data.uid || doc.id,
            email: data.email || null,
            displayName: data.displayName || null,
            photoURL: data.photoURL || null,
            phoneNumber: data.phoneNumber || null,
            createdAt: data.createdAt,
            lastSeen: data.lastSeen,
            isOnline: data.isOnline || false,
          } as User;
        });
        
        setAvailableUsers(allUsers);
        
        // Set up real-time listener for user's chats
        unsubscribeChats = getUserChats(user.uid, (chats) => {
          // Filter out any chats that don't have current user as participant
          const userChats = chats.filter(chat => 
            chat.participants && chat.participants.includes(user.uid)
          );
          
          // Calculate total unread count
          const totalUnreadMessages = userChats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
          setTotalUnread(totalUnreadMessages);
          
          // Update state with chats
          setExistingChats(userChats);
          
          // Calculate which users DON'T have existing chats
          const usersWithExistingChats = new Set<string>();
          
          userChats.forEach(chat => {
            const otherParticipants = chat.participants?.filter(pid => pid !== user.uid) || [];
            otherParticipants.forEach(pid => {
              usersWithExistingChats.add(pid);
            });
          });
          
          // Filter available users to only show those WITHOUT existing chats
          const usersWithoutExistingChats = allUsers.filter(user => 
            !usersWithExistingChats.has(user.uid)
          );
          
          setUsersWithoutChats(usersWithoutExistingChats);
        });
        
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      if (unsubscribeChats) {
        unsubscribeChats();
      }
    };
  }, [user, currentChatId]);

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
      
      // Close sidebar on mobile
      if (onSelectChat) {
        onSelectChat();
      }
      
      // Use router.push for proper navigation
      router.push(`/chat/${chatRef.id}`);
      
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error creating chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle chat click - mark messages as read when user clicks on chat
  const handleChatClick = async (chatId: string, hasUnread: boolean, e?: React.MouseEvent) => {
    // Prevent default link behavior if event is provided
    if (e) {
      e.preventDefault();
    }
    
    console.log('🔄 Chat clicked:', chatId, 'Has unread:', hasUnread);
    
    // Mark messages as read when user clicks on any chat (not just current one)
    if (hasUnread && user) {
      try {
        console.log('📨 Marking messages as read for chat:', chatId);
        await markAllMessagesAsRead(chatId, user.uid);
        console.log('✅ Messages marked as read successfully');
      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    }
    
    // Use router.push for navigation instead of Link
    router.push(`/chat/${chatId}`);
    
    // Close sidebar on mobile when chat is selected
    if (onSelectChat) {
      onSelectChat();
    }
  };

  // Get other user's info from chat (one-to-one only)
  const getOtherUserInfo = (chat: Chat) => {
    if (!user) return { name: 'Unknown User', email: '', photoURL: null };
    
    const otherParticipants = chat.participants?.filter(pid => pid !== user.uid) || [];
    
    if (otherParticipants.length === 0) {
      return { name: 'Unknown User', email: '', photoURL: null };
    }
    
    // For one-on-one chats, get the other user
    const otherUserId = otherParticipants[0];
    const otherUser = availableUsers.find(u => u.uid === otherUserId);
    
    if (!otherUser) {
      return { name: 'Unknown User', email: '', photoURL: null };
    }
    
    return {
      name: otherUser.displayName || otherUser.email || 'Unknown User',
      email: otherUser.email || '',
      photoURL: otherUser.photoURL
    };
  };

  // Format last message time
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
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  // New Chat Modal Component
  const NewChatModal = () => {
    if (!showNewChatModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
          {/* Modal Header */}
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              Start New Chat
            </h3>
            <button
              onClick={() => setShowNewChatModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {usersWithoutChats.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">All Caught Up! 🎉</h4>
                <p className="text-gray-500 text-sm">
                  You're already chatting with everyone.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-gray-600">
                    Select a user to start chatting
                  </p>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {usersWithoutChats.length} available
                  </span>
                </div>
                
                {usersWithoutChats.map((otherUser) => (
                  <button
                    key={otherUser.uid}
                    onClick={() => createNewChat(otherUser.uid)}
                    disabled={loading}
                    className="w-full flex items-center p-3 rounded-lg bg-white hover:bg-blue-50 transition-all border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      {/* User Avatar */}
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {otherUser.displayName?.[0]?.toUpperCase() || otherUser.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        {/* Online Status Indicator */}
                        {otherUser.isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        )}
                      </div>
                      
                      {/* User Info */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {otherUser.displayName || 'Unknown User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {otherUser.email}
                        </p>
                      </div>
                    </div>
                    
                    {/* Add Icon */}
                    <div className="text-blue-500 transform transition-transform group-hover:scale-110 p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              onClick={() => setShowNewChatModal(false)}
              className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
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
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
        </div>
        
        {/* Loading State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 text-sm">Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-80 bg-white border-r border-gray-200 h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
              <p className="text-sm text-gray-600 mt-1">
                {existingChats.length} conversations
                {totalUnread > 0 && ` • ${totalUnread} unread`}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 font-medium">
                  {totalUnread > 99 ? '99+' : totalUnread}
                </span>
              )}
              {/* Plus Icon for New Chat */}
              <button
                onClick={() => setShowNewChatModal(true)}
                className="w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-sm hover:shadow-md"
                title="Start New Chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto">
          {existingChats.length > 0 ? (
            <div className="p-2">
              {existingChats.map((chat) => {
                const unreadCount = chat.unreadCount || 0;
                const hasUnread = unreadCount > 0;
                const isActiveChat = chat.id === currentChatId;
                const otherUserInfo = getOtherUserInfo(chat);
                
                return (
                  <div
                    key={chat.id}
                    className={`block p-3 rounded-lg mb-1 transition-all border cursor-pointer ${
                      isActiveChat 
                        ? 'bg-blue-50 border-blue-200 shadow-sm' 
                        : hasUnread 
                          ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' 
                          : 'bg-white border-gray-100 hover:bg-gray-50'
                    }`}
                    onClick={(e) => handleChatClick(chat.id, hasUnread, e)}
                  >
                    <div className="flex items-center space-x-3">
                      {/* User Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                          hasUnread ? 'bg-green-500' : 
                          isActiveChat ? 'bg-blue-500' : 'bg-gray-400'
                        }`}>
                          {otherUserInfo.photoURL ? (
                            <img 
                              src={otherUserInfo.photoURL} 
                              alt={otherUserInfo.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            otherUserInfo.name[0]?.toUpperCase() || 'U'
                          )}
                        </div>
                        {/* Unread Indicator */}
                        {hasUnread && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <p className={`font-semibold text-sm truncate ${
                            hasUnread ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {otherUserInfo.name}
                          </p>
                          {chat.lastMessageTimestamp && (
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                              {formatLastMessageTime(chat.lastMessageTimestamp)}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 truncate mt-1">
                          {otherUserInfo.email}
                        </p>
                        
                        <p className={`text-sm truncate mt-1 ${
                          hasUnread ? 'text-green-600 font-medium' : 'text-gray-600'
                        }`}>
                          {chat.lastMessage || 'Start a conversation...'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-gray-500 text-sm mb-4">Start your first chat</p>
                
                {/* Big Plus Button when no chats */}
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="w-12 h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg mx-auto mb-3"
                  title="Start New Chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
                
                <p className="text-xs text-gray-400">
                  {usersWithoutChats.length} users available to chat with
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Current User Info */}
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.displayName || 'You'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
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