// components/chat/ChatWindow.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getMessages, sendMessage, markAllMessagesAsRead } from '@/lib/firestore';
import { Message, User } from '@/types';
import ScrollToBottom from 'react-scroll-to-bottom';

interface ChatWindowProps {
  chatId: string;
  otherUser?: User | null;
  isActive?: boolean;
}

export default function ChatWindow({ chatId, otherUser, isActive = true }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMarkedInitialRead, setHasMarkedInitialRead] = useState(false);
  
  const previousMessagesRef = useRef<Message[]>([]);
  const messagesListenerRef = useRef<(() => void) | null>(null);

  // ✅ FIXED: Stable participant name with fallback
 const getParticipantName = useCallback(() => {
    if (otherUser) {
      console.log('✅ ChatWindow - OtherUser found:', otherUser.displayName || otherUser.email);
      return otherUser.displayName || otherUser.email?.split('@')[0] || 'User';
    }
    
    // If no otherUser but we have a chatId, show a generic name
    if (chatId) {
      console.log('⚠️ ChatWindow - No otherUser, using fallback name');
      return 'Chat Participant';
    }
    
    console.log('❌ ChatWindow - No chat selected');
    return 'Select a chat';
  }, [otherUser, chatId]);

  const participantName = getParticipantName();

  // ✅ FIXED: Single messages listener setup
  useEffect(() => {
    if (!chatId || !user) {
      console.log('❌ ChatWindow - Missing chatId or user');
      return;
    }

    // Clean up previous listener
    if (messagesListenerRef.current) {
      console.log('🧹 Cleaning up previous messages listener');
      messagesListenerRef.current();
    }

    console.log('🔍 Setting up messages listener for chat:', chatId);

    messagesListenerRef.current = getMessages(chatId, (msgs) => {
      console.log('📨 Received messages:', msgs.length);
      
      setMessages(msgs);
      previousMessagesRef.current = msgs;

      // Mark messages as read when chat is active
      if (msgs.length > 0 && !hasMarkedInitialRead && isActive) {
        const unreadMessages = msgs.filter(
          (m) => !m.readBy?.includes(user.uid) && m.senderId !== user.uid
        );
        
        if (unreadMessages.length > 0) {
          console.log('📖 Marking messages as read for active chat');
          markAllMessagesAsRead(chatId, user.uid)
            .then(() => {
              console.log('✅ Messages marked as read');
              setHasMarkedInitialRead(true);
            })
            .catch((error) => {
              console.error('❌ Error marking messages as read:', error);
            });
        } else {
          setHasMarkedInitialRead(true);
        }
      }
    });

    return () => {
      console.log('🧹 Cleaning up messages listener for chat:', chatId);
      if (messagesListenerRef.current) {
        messagesListenerRef.current();
        messagesListenerRef.current = null;
      }
      setHasMarkedInitialRead(false);
    };
  }, [chatId, user, isActive, hasMarkedInitialRead]);

  // ✅ FIXED: Send message with better error handling
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    const messageText = newMessage.trim();
    
    try {
      setLoading(true);
      console.log('📤 Sending message:', messageText.substring(0, 50) + '...');
      
      await sendMessage(chatId, {
        text: messageText,
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'User'
      });
      
      setNewMessage('');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      // You might want to show a toast notification here
    } finally {
      setLoading(false);
    }
  };

  // Time formatting
  const formatMessageTime = (timestamp: { toDate: () => Date } | null) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  // Message status icons
  const getMessageStatusIcon = (m: Message) => {
    if (m.senderId !== user?.uid) return null;
    
    const readByCount = m.readBy?.length || 0;
    
    if (readByCount >= 2) { // Both participants have read
      return <span className="text-blue-500 ml-2" title="Read">✓✓</span>;
    } else if (m.status === 'delivered') {
      return <span className="text-gray-400 ml-2" title="Delivered">✓✓</span>;
    } else {
      return <span className="text-gray-400 ml-2" title="Sent">✓</span>;
    }
  };

  // Handle Enter key for sending
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-green-50 p-6">
        <div className="text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">💬</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Welcome to Chat</h3>
          <p className="text-gray-600 max-w-md">
            Select a conversation from the sidebar to start messaging or create a new chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
       
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {participantName[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {participantName}
              </h2>
              <p className="text-sm text-gray-600 flex items-center">
                <span className={`w-2 h-2 rounded-full mr-2 ${otherUser?.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                {otherUser?.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border border-green-200">
            <div className={`w-2 h-2 rounded-full ${otherUser?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            <span className={`text-xs font-medium ${otherUser?.isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {otherUser?.isOnline ? 'Active now' : 'Last seen recently'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        <ScrollToBottom 
          className="h-full w-full"
          followButtonClassName="scroll-to-bottom-follow-button"
          initialScrollBehavior="smooth"
        >
          <div className="p-4 md:p-6 min-h-full">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-gray-500">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">👋</span>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No messages yet</h3>
                <p className="text-gray-500 text-center max-w-sm">
                  Start the conversation by sending your first message to {participantName}.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((m, index) => {
                  const isOwn = m.senderId === user?.uid;
                  const senderName = isOwn ? 'You' : participantName;
                  const isUnread = !m.readBy?.includes(user?.uid || '') && !isOwn;
                  const showDate = index === 0 || 
                    (messages[index - 1]?.timestamp?.toDate().toDateString() !== m.timestamp?.toDate().toDateString());
                  
                  return (
                    <div key={m.id}>
                      {showDate && (
                        <div className="flex justify-center my-4">
                          <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                            {m.timestamp?.toDate().toLocaleDateString([], { 
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                      
                      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl transition-all duration-200 ${
                            isOwn
                              ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm'
                              : `bg-white text-gray-800 border border-gray-200 shadow-sm ${
                                  isUnread ? 'border-l-4 border-l-yellow-400' : ''
                                }`
                          }`}
                        >
                          {/* Show sender name for other user's messages */}
                          {!isOwn && (
                            <p className="text-xs font-semibold text-gray-600 mb-1">{senderName}</p>
                          )}
                          <p className="text-sm break-words leading-relaxed">{m.text}</p>
                          <div
                            className={`flex justify-between items-center mt-2 ${
                              isOwn ? 'text-green-100' : 'text-gray-500'
                            }`}
                          >
                            <span className="text-xs">
                              {formatMessageTime(m.timestamp)}
                              {isUnread && <span className="ml-2 text-yellow-500 animate-pulse" title="Unread">●</span>}
                            </span>
                            {getMessageStatusIcon(m)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollToBottom>
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${participantName}...`}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 transition-all duration-200"
              disabled={loading}
              maxLength={1000}
            />
            {newMessage.length > 0 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded-full border">
                  {newMessage.length}/1000
                </span>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="px-6 py-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center min-w-[80px]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="flex items-center">
                Send
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}