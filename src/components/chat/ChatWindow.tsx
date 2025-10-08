// --- path: /src/components/chat/ChatWindow.tsx ---
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getMessages, sendMessage, markAllMessagesAsRead } from '@/lib/firestore';
import { Message,User } from '@/types';
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';

interface ChatWindowProps {
  chatId: string;
   otherUser?: User | null; // Add participant name prop
}

  export default function ChatWindow({ chatId, otherUser }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isUserActiveInThisChat, setIsUserActiveInThisChat] = useState(false);
  const [hasMarkedMessagesRead, setHasMarkedMessagesRead] = useState(false);

  // Get participant name from otherUser
  const participantName = otherUser?.displayName || otherUser?.email?.split('@')[0] || 'User';
  // Set user as active in this chat when component mounts
  useEffect(() => {
    if (chatId && user) {
      setIsUserActiveInThisChat(true);
      setHasMarkedMessagesRead(false);
    }

    return () => {
      setIsUserActiveInThisChat(false);
      setHasMarkedMessagesRead(false);
    };
  }, [chatId, user]);

  // Fetch messages in real-time and auto-mark as read when user is active
  useEffect(() => {
    if (!chatId || !user) return;

    const unsubscribe = getMessages(chatId, (messages) => {
      setMessages(messages);
      
      // Auto-mark messages as read when user is active in this chat
      if (messages.length > 0 && isUserActiveInThisChat && !hasMarkedMessagesRead) {
        const unreadMessages = messages.filter(msg => 
          !msg.readBy?.includes(user.uid) && msg.senderId !== user.uid
        );
        
        if (unreadMessages.length > 0) {
          markAllMessagesAsRead(chatId, user.uid)
            .then(() => {
              setHasMarkedMessagesRead(true);
            })
            .catch(console.error);
        } else {
          setHasMarkedMessagesRead(true);
        }
      }
    });

    return unsubscribe;
  }, [chatId, user, isUserActiveInThisChat, hasMarkedMessagesRead]);

  // Auto-mark messages as read when user becomes active in this chat
  useEffect(() => {
    if (isUserActiveInThisChat && messages.length > 0 && user && !hasMarkedMessagesRead) {
      const unreadMessages = messages.filter(msg => 
        !msg.readBy?.includes(user.uid) && msg.senderId !== user.uid
      );
      
      if (unreadMessages.length > 0) {
        markAllMessagesAsRead(chatId, user.uid)
          .then(() => {
            setHasMarkedMessagesRead(true);
          })
          .catch(console.error);
      } else {
        setHasMarkedMessagesRead(true);
      }
    }
  }, [isUserActiveInThisChat, messages, chatId, user, hasMarkedMessagesRead]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset hasMarkedMessagesRead when new messages arrive and user is active
  useEffect(() => {
    if (isUserActiveInThisChat && messages.length > 0) {
      const hasNewUnreadMessages = messages.some(msg => 
        !msg.readBy?.includes(user?.uid || '') && msg.senderId !== user?.uid
      );
      
      if (hasNewUnreadMessages && hasMarkedMessagesRead) {
        setHasMarkedMessagesRead(false);
      }
    }
  }, [messages, isUserActiveInThisChat, user, hasMarkedMessagesRead]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    try {
      setLoading(true);
      await sendMessage(chatId, {
        text: newMessage,
        senderId: user.uid,
        read: false,
        type: 'text'
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  // Get message status icon
  const getMessageStatusIcon = (message: Message) => {
    const isOwnMessage = message.senderId === user?.uid;
    
    if (!isOwnMessage) return null;

    switch (message.status) {
      case 'read':
        return (
          <span className="text-blue-500 ml-2" title="Read">
            ✓✓
          </span>
        );
      case 'delivered':
        return (
          <span className="text-gray-400 ml-2" title="Delivered">
            ✓✓
          </span>
        );
      case 'sent':
      default:
        return (
          <span className="text-gray-400 ml-2" title="Sent">
            ✓
          </span>
        );
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a chat</h3>
          <p className="text-gray-500">Choose a conversation from the sidebar to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="bg-green-50 px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {participantName}
            </h2>
            <p className="text-sm text-gray-600">Active now</p>
          </div>
          {isUserActiveInThisChat && (
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600 font-medium">Online</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-gray-500">Start the conversation by sending a message</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.senderId === user?.uid;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <div className={`flex justify-between items-center mt-1 ${
                      isOwnMessage ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      <span className="text-xs">
                        {formatMessageTime(message.timestamp)}
                      </span>
                      {isOwnMessage && (
                        <div className="flex items-center">
                          {getMessageStatusIcon(message)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}