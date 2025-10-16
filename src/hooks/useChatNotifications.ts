// hooks/useChatNotifications.ts
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Chat } from '@/types';
import toast from 'react-hot-toast';

export const useChatNotifications = (currentChatId?: string) => {
  const router = useRouter();
  const notificationPermissionRef = useRef<boolean>(false);
  const previousChatsRef = useRef<Chat[]>([]);

  // Request notification permission
  useEffect(() => {
    const requestNotificationPermission = async () => {
      if ('Notification' in window) {
        try {
          const permission = await Notification.requestPermission();
          notificationPermissionRef.current = permission === 'granted';
          console.log('🔔 Notification permission:', permission);
        } catch (error) {
          console.error('Error requesting notification permission:', error);
        }
      }
    };

    requestNotificationPermission();
  }, []);

  // Show browser notification
  const showBrowserNotification = (chat: Chat, otherUserInfo: any, unreadCount: number) => {
    if (!notificationPermissionRef.current) return;

    // Don't show notification if user is on the same chat
    if (chat.id === currentChatId) return;

    // Don't show notification if app is in focus
    if (document.hasFocus()) return;

    const notificationTitle = `New message from ${otherUserInfo.name}`;
    const notificationBody = chat.lastMessage || 'You have a new message';

    const notification = new Notification(notificationTitle, {
      body: notificationBody,
      icon: otherUserInfo.photoURL || '/default-avatar.png',
      tag: chat.id, // Group notifications by chat
      requireInteraction: true, // Stay until user interacts
      data: {
        chatId: chat.id,
        userId: chat.participants?.find(pid => pid !== otherUserInfo.uid)
      }
    });

    notification.onclick = () => {
      window.focus();
      router.push(`/chat/${chat.id}`);
      notification.close();
    };

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close();
    }, 10000);
  };

  // Check for new unread messages
  const checkForNewUnreadMessages = (currentChats: Chat[], getOtherUserInfo: (chat: Chat) => any) => {
    if (!previousChatsRef.current.length) {
      previousChatsRef.current = currentChats;
      return;
    }

    currentChats.forEach(currentChat => {
      const previousChat = previousChatsRef.current.find(chat => chat.id === currentChat.id);
      const currentUnread = currentChat.unreadCount || 0;
      const previousUnread = previousChat?.unreadCount || 0;

      // If unread count increased and there are new unread messages
      if (currentUnread > previousUnread && currentUnread > 0) {
        const otherUserInfo = getOtherUserInfo(currentChat);
        console.log(`🔔 New unread message in chat ${currentChat.id} from ${otherUserInfo.name}`);
        
        // Show browser notification
        showBrowserNotification(currentChat, otherUserInfo, currentUnread);
        
        // Also show toast notification
        toast.success(`New message from ${otherUserInfo.name}`, {
          duration: 4000,
          position: 'top-right',
          onClick: () => {
            router.push(`/chat/${currentChat.id}`);
          }
        });
      }
    });

    previousChatsRef.current = currentChats;
  };

  return {
    checkForNewUnreadMessages,
    hasNotificationPermission: notificationPermissionRef.current
  };
};