'use client';

import { useEffect, useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getFCMToken, onForegroundMessage, isFCMSupported, deleteFCMToken } from '@/lib/firebase-messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/components/auth/AuthProvider';

export const useNotifications = () => {
  const { user } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Initialize FCM with better setup
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeFCM = async () => {
      try {
        console.log('🔄 Initializing FCM...');
        
        // Check if FCM is supported
        const supported = await isFCMSupported();
        setIsSupported(supported);
        
        if (!supported) {
          console.log('🚫 FCM not supported, using fallback notifications');
          return;
        }

        console.log('🔍 FCM supported, proceeding...');

        // Get FCM token
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          console.log('✅ FCM initialized with token');
          
          // Store token in user's document
          if (user) {
            try {
              const userRef = doc(firestore, 'users', user.uid);
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(token),
                notificationEnabled: true,
                lastFCMUpdate: new Date()
              });
              console.log('✅ FCM token stored in user document');
            } catch (error) {
              console.error('❌ Error storing FCM token:', error);
            }
          }
        } else {
          console.log('❌ Failed to get FCM token');
        }

        // Set up foreground message listener
        unsubscribe = await onForegroundMessage((payload) => {
          console.log('📱 Foreground FCM message received:', payload);
          
          // Show toast notification
          if (payload.notification) {
            this.showNotification(
              payload.notification.title || 'New Message',
              payload.notification.body || 'You have a new message',
              true
            );
          }
        });

      } catch (error) {
        console.error('❌ Error initializing FCM:', error);
      }
    };

    // Only initialize if we have permission or can request it
    if (permission === 'granted' || permission === 'default') {
      initializeFCM();
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, permission]);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (!('Notification' in window)) {
        console.log('🚫 Notifications not supported');
        return false;
      }

      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Reinitialize FCM after permission granted
        const token = await getFCMToken();
        if (token) {
          setFcmToken(token);
          return true;
        }
      }
      
      return result === 'granted';
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Show notification function with fallbacks
  const showNotification = useCallback((title: string, body: string, isImportant = false) => {
    // Always show toast as fallback
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

    // Try to show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      // Don't show if tab is active and it's not important
      if (isImportant || !document.hasFocus()) {
        const notification = new Notification(title, { 
          body, 
          icon: '/icon.png',
          badge: '/badge.png',
          tag: 'chat-notification'
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    }
  }, []);

  const showNewMessageNotification = useCallback((senderName: string, message: string, isActiveChat: boolean = false) => {
    if (isActiveChat && document.hasFocus()) {
      return; // Don't notify for active chat
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

  // Disable notifications
  const disableNotifications = useCallback(async () => {
    try {
      await deleteFCMToken();
      setFcmToken(null);
      
      if (user) {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDoc(userRef, {
          notificationEnabled: false
        });
      }
    } catch (error) {
      console.error('❌ Error disabling notifications:', error);
    }
  }, [user]);

  return {
    fcmToken,
    isFCMSupported: isSupported,
    notificationPermission: permission,
    requestPermission,
    disableNotifications,
    showNotification,
    showNewMessageNotification,
    showUnreadMessagesNotification,
    showSidebarUnreadNotification
  };
};