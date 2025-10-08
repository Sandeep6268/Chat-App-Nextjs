// components/chat/ChatWindow.tsx
// components/ChatWindow.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getMessages, sendMessage, markAllMessagesAsRead } from '@/lib/firestore';
import { Message, User } from '@/types';
import ScrollToBottom from 'react-scroll-to-bottom';
import { useNotifications } from '@/hooks/useNotifications';
import { toast } from 'react-hot-toast';

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
  const [hasNotifiedUnread, setHasNotifiedUnread] = useState(false);
  const { showNewMessageNotification, showUnreadMessagesNotification } = useNotifications();
  const previousMessagesRef = useRef<Message[]>([]);

  const participantName =
    otherUser?.displayName || otherUser?.email?.split('@')[0] || 'User';

  // 🔥 Realtime messages with notifications - FIXED VERSION
  useEffect(() => {
  if (!chatId || !user) return;

  const unsubscribe = getMessages(chatId, (msgs) => {
    // Check for new messages
    if (previousMessagesRef.current.length > 0 && msgs.length > previousMessagesRef.current.length) {
      const newMessages = msgs.slice(previousMessagesRef.current.length);
      
      newMessages.forEach((message) => {
        // Show notification for new messages from other users
        if (message.senderId !== user.uid) {
          const isChatActive = isActive && document.hasFocus();
          
          // Only show notifications if they can be used
          if (typeof window !== 'undefined') {
            showNewMessageNotification(
              participantName,
              message.text,
              isChatActive
            );
          }
        }
      });
    }

    setMessages(msgs);
    previousMessagesRef.current = msgs;

      // ✅ Mark unread messages as read when chat opens
      if (msgs.length > 0 && !hasMarkedInitialRead && isActive) {
        const unread = msgs.filter(
          (m) => !m.readBy?.includes(user.uid) && m.senderId !== user.uid
        );
        if (unread.length > 0) {
          markAllMessagesAsRead(chatId, user.uid)
            .then(() => setHasMarkedInitialRead(true))
            .catch(console.error);
        } else {
          setHasMarkedInitialRead(true);
        }
      }
    });

    return () => {
      unsubscribe();
      setHasMarkedInitialRead(false);
      setHasNotifiedUnread(false);
      previousMessagesRef.current = [];
    };
  }, [
    chatId, 
    user, 
    hasMarkedInitialRead, 
    hasNotifiedUnread, 
    isActive, 
    participantName, 
    showNewMessageNotification, 
    showUnreadMessagesNotification
  ]);

  // ✉️ Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    try {
      setLoading(true);
      await sendMessage(chatId, {
        text: newMessage.trim(),
        senderId: user.uid,
        read: false,
        type: 'text',
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatMessageTime = (timestamp: { toDate: () => Date } | null) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate();
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getMessageStatusIcon = (m: Message) => {
    if (m.senderId !== user?.uid) return null;
    switch (m.status) {
      case 'read':
        return <span className="text-blue-500 ml-2">✓✓</span>;
      case 'delivered':
        return <span className="text-gray-400 ml-2">✓✓</span>;
      default:
        return <span className="text-gray-400 ml-2">✓</span>;
    }
  };

  if (!chatId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header - Fixed */}
      <div className="bg-green-50 px-6 py-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {participantName}
            </h2>
            <p className="text-sm text-gray-600">Active now</p>
          </div>
          <div className="flex items-center space-x-2">
            

            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Container - Scrollable Area */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <ScrollToBottom 
          className="h-full w-full"
          followButtonClassName="scroll-to-bottom-follow-button"
          initialScrollBehavior="smooth"
          checkInterval={100}
          debounce={100}
        >
          <div className="p-6 min-h-full">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[200px] text-gray-500">
                No messages yet. Start a conversation!
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((m) => {
                  const isOwn = m.senderId === user?.uid;
                  const isUnread = !m.readBy?.includes(user?.uid || '') && !isOwn;
                  
                  return (
                    <div
                      key={m.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-green-500 text-white'
                            : `bg-white text-gray-800 border ${
                                isUnread ? 'border-2 border-yellow-400' : 'border-gray-200'
                              }`
                        }`}
                      >
                        <p className="text-sm break-words">{m.text}</p>
                        <div
                          className={`flex justify-between items-center mt-1 ${
                            isOwn ? 'text-green-100' : 'text-gray-500'
                          }`}
                        >
                          <span className="text-xs">
                            {formatMessageTime(m.timestamp)}
                            {isUnread && <span className="ml-2 text-yellow-500">●</span>}
                          </span>
                          {getMessageStatusIcon(m)}
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

      {/* Input - Fixed */}
      <div className="border-t border-gray-200 bg-white p-4 flex-shrink-0">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Send'
            )}
          </button>
        </form>
      </div>

      {/* Custom CSS for scroll button */}
      <style jsx global>{`
        .scroll-to-bottom-follow-button {
          background-color: #10B981 !important;
          color: white !important;
          border-radius: 50% !important;
          width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: none !important;
          cursor: pointer !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          position: absolute !important;
          bottom: 80px !important;
          right: 20px !important;
          z-index: 1000 !important;
          opacity: 0.9 !important;
          transition: all 0.2s ease-in-out !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 14l-7 7m0 0l-7-7m7 7V3'%3E%3C/path%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
          background-size: 20px 20px !important;
        }
        
        .scroll-to-bottom-follow-button:hover {
          background-color: #059669 !important;
          opacity: 1 !important;
          transform: scale(1.05) !important;
        }
      `}</style>
    </div>
  );
}