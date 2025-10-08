// hooks/useMessageNotifications.ts
'use client';

import { useCallback } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useNotifications } from './useNotifications';

export const useMessageNotifications = () => {
  const { user } = useAuth();
  const { sendPushNotification } = useNotifications();

  const notifyMessageRecipient = useCallback(async (
    chatId: string,
    participants: string[],
    messageContent: string,
    senderName?: string
  ) => {
    if (!user) return false;

    try {
      // Find the other user (receiver)
      const otherUserId = participants.find(pid => pid !== user.uid);
      if (!otherUserId) {
        console.log('❌ No other user found in chat');
        return false;
      }

      // Get receiver's user data
      const receiverDoc = await getDoc(doc(firestore, 'users', otherUserId));
      if (!receiverDoc.exists()) {
        console.log('❌ Receiver user document not found');
        return false;
      }

      const receiverData = receiverDoc.data();
      
      // Send push notification to RECEIVER
      const success = await sendPushNotification(
        otherUserId, // This is the RECEIVER's user ID
        `💬 ${senderName || user.displayName || 'Someone'}`,
        messageContent.length > 100 
          ? messageContent.substring(0, 100) + '...' 
          : messageContent,
        {
          chatId: chatId,
          senderId: user.uid, // This is the SENDER's user ID
          type: 'new_message',
          timestamp: new Date().toISOString()
        }
      );

      if (success) {
        console.log(`✅ Push notification sent to ${receiverData.displayName || 'user'}`);
      } else {
        console.log(`❌ Failed to send push notification to ${receiverData.displayName || 'user'}`);
      }

      return success;

    } catch (error) {
      console.error('❌ Error sending message notification:', error);
      return false;
    }
  }, [user, sendPushNotification]);

  return {
    notifyMessageRecipient
  };
};