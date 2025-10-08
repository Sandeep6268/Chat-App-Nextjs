'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { getMessages, sendMessage, markAllMessagesAsRead } from '@/lib/firestore';
import { Message, User } from '@/types';

interface ChatWindowProps {
  chatId: string;
  otherUser?: User | null;
}

export default function ChatWindow({ chatId, otherUser }: ChatWindowProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [hasMarkedInitialRead, setHasMarkedInitialRead] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isUserAtBottom, setIsUserAtBottom] = useState(true);

  const participantName = otherUser?.displayName || otherUser?.email?.split('@')[0] || 'User';

  // ✅ Check scroll position properly
  const isNearBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < 100;
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior });
      setShowScrollButton(false);
      setIsUserAtBottom(true);
    }
  }, []);

  // ✅ Scroll handler - user can scroll up now
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const nearBottom = isNearBottom();
    setIsUserAtBottom(nearBottom);
    setShowScrollButton(!nearBottom);
  }, [isNearBottom]);

  // ✅ Realtime message subscription
  useEffect(() => {
    if (!chatId || !user) return;

    const unsubscribe = getMessages(chatId, (msgs) => {
      setMessages(msgs);

      // Mark unread as read once
      if (msgs.length > 0 && !hasMarkedInitialRead) {
        const unread = msgs.filter(
          (m) => !m.readBy?.includes(user.uid) && m.senderId !== user.uid
        );
        if (unread.length > 0) {
          markAllMessagesAsRead(chatId, user.uid).catch(console.error);
        }
        setHasMarkedInitialRead(true);
      }

      // ✅ Only scroll if user is at bottom OR message is sent by self
      const lastMsg = msgs[msgs.length - 1];
      const sentBySelf = lastMsg?.senderId === user.uid;

      if (sentBySelf || isUserAtBottom) {
        setTimeout(() => scrollToBottom('smooth'), 100);
      }
    });

    return () => unsubscribe();
  }, [chatId, user, hasMarkedInitialRead, isUserAtBottom, scrollToBottom]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      setLoading(true);
      await sendMessage(chatId, {
        text: newMessage,
        senderId: user.uid,
        read: false,
        type: 'text',
      });
      setNewMessage('');
      setTimeout(() => scrollToBottom('smooth'), 100);
    } catch (err) {
      console.error(err);
      alert('Error sending message.');
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

  const getMessageStatusIcon = (message: Message) => {
    const isOwn = message.senderId === user?.uid;
    if (!isOwn) return null;
    switch (message.status) {
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
        <p>Select a chat to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Header */}
      <div className="bg-green-50 px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">{participantName}</h2>
            <p className="text-sm text-gray-600">Active now</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-green-600 font-medium">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 bg-gray-50 relative"
        style={{ height: 'calc(100vh - 180px)' }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No messages yet
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.senderId === user?.uid;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-green-500 text-white'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <div
                      className={`flex justify-between items-center mt-1 ${
                        isOwn ? 'text-green-100' : 'text-gray-500'
                      }`}
                    >
                      <span className="text-xs">{formatMessageTime(msg.timestamp)}</span>
                      {isOwn && getMessageStatusIcon(msg)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={() => scrollToBottom('smooth')}
            className="sticky bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors z-20"
          >
            ↓
          </button>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4 sticky bottom-0 z-10">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || loading}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:ring-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
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
