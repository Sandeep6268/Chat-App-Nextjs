// hooks/useNotifications.ts
'use client';

import { useEffect, useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getFCMToken, onForegroundMessage, isFCMSupported } from '@/lib/firebase-messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';

export const useNotifications = () => {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);

  // Initialize FCM
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        console.log('🔄 Initializing FCM...');
        
        // Check if FCM is supported
        const supported = await isFCMSupported();
        setIsSupported(supported);
        
        if (!supported) {
          console.log('🚫 FCM not supported, falling back to browser notifications');
          return;
        }

        // Get FCM token
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          console.log('✅ FCM initialized with token');
          
          // Store token in user's document (optional)
          if (user) {
            try {
              const userRef = doc(firestore, 'users', user.uid);
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(token)
              });
              console.log('✅ FCM token stored in user document');
            } catch (error) {
              console.error('❌ Error storing FCM token:', error);
            }
          }
        }

        // Set up foreground message listener
        const unsubscribe = await onForegroundMessage((payload) => {
          console.log('📱 Foreground FCM message:', payload);
          
          // Show toast notification
          if (payload.notification) {
            toast.success(payload.notification.body || 'New message', {
              duration: 4000,
              position: 'top-right',
              style: {
                background: '#10B981',
                color: '#fff',
              },
            });
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error('❌ Error initializing FCM:', error);
      }
    };

    initializeFCM();
  }, [user]);

  // Show notification function
  const showNotification = useCallback((title: string, body: string, isImportant = false) => {
    // Always show toast (fallback)
    if (isImportant) {
      toast.success(body, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
        },
      });
    } else {
      toast.success(body, {
        duration: 3000,
        position: 'top-right',
      });
    }

    // Try to show browser notification if FCM is not available
    if (!isSupported && 'Notification' in window && Notification.permission === 'granted') {
      if (!document.hasFocus()) {
        new Notification(title, { 
          body, 
          icon: '/icon.png'
        });
      }
    }
  }, [isSupported]);

  const showNewMessageNotification = useCallback((senderName: string, message: string, isActiveChat: boolean = false) => {
    if (isActiveChat && document.hasFocus()) {
      return;
    }

    showNotification(
      `New message from ${senderName}`,
      message,
      true
    );
  }, [showNotification]);

  const showUnreadMessagesNotification = useCallback((senderName: string, unreadCount: number) => {
    showNotification(
      `Unread messages from ${senderName}`,
      `You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`,
      true
    );
  }, [showNotification]);

  const showSidebarUnreadNotification = useCallback((totalUnread: number, chatCount: number) => {
    if (totalUnread === 0) return;

    showNotification(
      'Unread Messages',
      `You have ${totalUnread} unread message${totalUnread > 1 ? 's' : ''} in ${chatCount} conversation${chatCount > 1 ? 's' : ''}`,
      true
    );
  }, [showNotification]);

  return {
    fcmToken,
    isFCMSupported: isSupported,
    showNotification,
    showNewMessageNotification,
    showUnreadMessagesNotification,
    showSidebarUnreadNotification
  };
};