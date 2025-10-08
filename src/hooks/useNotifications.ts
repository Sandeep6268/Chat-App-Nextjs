// hooks/useNotifications.ts
'use client';

import { useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { requestNotificationPermission, showBrowserNotification } from '@/lib/firebase-messaging';

export const useNotifications = () => {
  useEffect(() => {
    // Request notification permission when component mounts
    const initializeNotifications = async () => {
      try {
        await requestNotificationPermission();
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  // ✅ Use useCallback to prevent unnecessary re-renders
  const showNotification = useCallback((title: string, body: string, isImportant = false) => {
    // Show browser notification if permitted
    showBrowserNotification(title, body);
    
    // Show toast notification
    if (isImportant) {
      toast.success(body, {
        duration: 6000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
    } else {
      toast.success(body, {
        duration: 4000,
        position: 'top-right',
      });
    }
  }, []);

  const showNewMessageNotification = useCallback((senderName: string, message: string, isActiveChat: boolean = false) => {
    // Don't show notification if user is currently viewing the chat
    if (isActiveChat && document.hasFocus()) {
      return;
    }

    showNotification(
      `New message from ${senderName}`,
      message,
      true // Mark as important
    );
  }, [showNotification]);

  // ✅ For unread messages when chat opens
  const showUnreadMessagesNotification = useCallback((senderName: string, unreadCount: number) => {
    showNotification(
      `Unread messages from ${senderName}`,
      `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`,
      true
    );
  }, [showNotification]);

  // ✅ NEW: For sidebar unread messages notification
  const showSidebarUnreadNotification = useCallback((totalUnread: number, chatCount: number) => {
    if (totalUnread === 0) return;

    showNotification(
      'Unread Messages',
      `You have ${totalUnread} unread message${totalUnread > 1 ? 's' : ''} in ${chatCount} conversation${chatCount > 1 ? 's' : ''}`,
      true
    );
  }, [showNotification]);

  return {
    showNotification,
    showNewMessageNotification,
    showUnreadMessagesNotification,
    showSidebarUnreadNotification
  };
};