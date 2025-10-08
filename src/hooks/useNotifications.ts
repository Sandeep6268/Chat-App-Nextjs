// hooks/useNotifications.ts
'use client';

import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { requestForToken, onMessageListener } from '@/lib/firebase-messaging';

export const useNotifications = () => {
  useEffect(() => {
    // Initialize notifications when component mounts
    const initializeNotifications = async () => {
      try {
        // Request notification permission and get FCM token
        await requestForToken();

        // Listen for foreground messages
        onMessageListener().then((payload: any) => {
          console.log('Received foreground message:', payload);
          
          // Show toast notification
          if (payload?.notification) {
            toast.success(payload.notification.body || 'New message', {
              duration: 4000,
              position: 'top-right',
            });
          }
        });
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  const showNotification = (title: string, body: string, isImportant = false) => {
    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { 
        body, 
        icon: '/icon.png',
        requireInteraction: isImportant
      });
    }
    
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
  };

  const showNewMessageNotification = (senderName: string, message: string, isActiveChat: boolean = false) => {
    // Don't show notification if user is currently viewing the chat
    if (isActiveChat && document.hasFocus()) {
      return;
    }

    showNotification(
      `New message from ${senderName}`,
      message,
      true // Mark as important
    );
  };

  return {
    showNotification,
    showNewMessageNotification
  };
};