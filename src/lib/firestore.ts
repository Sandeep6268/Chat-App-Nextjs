// --- path: /src/lib/firestore.ts ---
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Chat, Message, User } from '@/types';

// Collection references
export const usersCollection = collection(firestore, 'users');
export const chatsCollection = collection(firestore, 'chats');
export const userChatsCollection = (userId: string) => 
  collection(firestore, 'userChats', userId, 'chats');

// Helper to get messages collection for a chat
export const messagesCollection = (chatId: string) => 
  collection(firestore, 'chats', chatId, 'messages');

// User operations
export const createUserProfile = async (user: User) => {
  try {
    const userRef = doc(firestore, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        phoneNumber: user.phoneNumber,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        isOnline: true,
      });
    } else {
      await updateDoc(userRef, {
        lastSeen: serverTimestamp(),
        isOnline: true,
      });
    }
    
    return userRef;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Chat operations - ONE-TO-ONE ONLY
export const createChat = async (participants: string[]) => {
  try {
    // Sort participants to ensure consistent chat ID generation
    const sortedParticipants = [...participants].sort();
    
    // Check if chat already exists between these exact users (one-to-one only)
    const existingChatsQuery = query(
      chatsCollection,
      where('participants', 'array-contains', sortedParticipants[0])
    );
    
    const existingChatsSnapshot = await getDocs(existingChatsQuery);
    
    let existingChat: any = null;
    
    existingChatsSnapshot.forEach((doc) => {
      const chatData = doc.data();
      const chatParticipants = chatData.participants || [];
      
      // Check if both participants arrays have the same users (one-to-one only)
      const hasAllParticipants = sortedParticipants.every(pid => 
        chatParticipants.includes(pid)
      );
      const sameLength = chatParticipants.length === sortedParticipants.length;
      
      if (hasAllParticipants && sameLength) {
        existingChat = doc;
      }
    });
    
    if (existingChat) {
      return doc(firestore, 'chats', existingChat.id);
    }

    // Create new one-to-one chat
    const chatData = {
      participants: sortedParticipants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isGroup: false, // Always false for one-to-one
    };

    const chatRef = await addDoc(chatsCollection, chatData);
    
    // Create userChat entries for each participant
    for (const participantId of sortedParticipants) {
      const userChatRef = doc(firestore, 'userChats', participantId, 'chats', chatRef.id);
      await setDoc(userChatRef, {
        chatId: chatRef.id,
        userId: participantId,
        lastRead: serverTimestamp(),
        muted: false,
        archived: false,
      });
    }
    
    return chatRef;
  } catch (error) {
    console.error('Error creating chat:', error);
    throw error;
  }
};

export const getChat = async (chatId: string) => {
  try {
    const chatRef = doc(firestore, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (chatSnap.exists()) {
      return { id: chatSnap.id, ...chatSnap.data() } as Chat;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting chat:', error);
    throw error;
  }
};

export const markAllMessagesAsRead = async (chatId: string, userId: string) => {
  try {
    //console.log('🔄 markAllMessagesAsRead called for chat:', chatId, 'user:', userId);
    
    const messagesRef = messagesCollection(chatId);
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(messagesQuery);
    
    let markedCount = 0;
    const batch = writeBatch(firestore);
    
    // Get chat data for participants
    const chatRef = doc(firestore, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    const chatData = chatSnap.data() as Chat;
    const participants = chatData.participants || [];
    
    // For one-to-one chat, there should be exactly 2 participants
    const otherParticipant = participants.find(pid => pid !== userId);
    
    for (const messageDoc of snapshot.docs) {
      const messageData = messageDoc.data();
      const readBy = messageData.readBy || [];
      const sender = messageData.sender || messageData.senderId;
      
      // Only mark messages from other user as read
      if (!readBy.includes(userId) && sender !== userId) {
        markedCount++;
        
        const messageRef = doc(firestore, 'chats', chatId, 'messages', messageDoc.id);
        const newReadBy = [...readBy, userId];
        
        // For one-to-one: message is read when the other participant reads it
        const isReadByOther = newReadBy.includes(otherParticipant || '');
        
        batch.update(messageRef, {
          readBy: newReadBy,
          read: true,
          status: isReadByOther ? 'read' : 'delivered'
        });
        
        //console.log(`✅ Marking message ${messageDoc.id} as read by ${userId}`);
      }
    }
    
    if (markedCount > 0) {
      await batch.commit();
      //console.log(`🎯 Successfully marked ${markedCount} messages as read`);
      
      // Update chat's last message status
      await updateDoc(chatRef, {
        lastMessageStatus: 'read',
        updatedAt: serverTimestamp()
      });
      
      //console.log('✅ Chat last message status updated to read');
    } else {
      //console.log('ℹ️ No messages to mark as read');
    }
    
  } catch (error) {
    console.error('❌ Error in markAllMessagesAsRead:', error);
    throw error;
  }
};

// FIXED: Improved calculateUnreadCount for better accuracy
export const calculateUnreadCount = async (chatId: string, userId: string): Promise<number> => {
  try {
    const messagesRef = messagesCollection(chatId);
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
    
    const snapshot = await getDocs(messagesQuery);
    let unreadCount = 0;
    
    snapshot.docs.forEach(messageDoc => {
      const messageData = messageDoc.data();
      const readBy = messageData.readBy || [];
      const sender = messageData.sender || messageData.senderId;
      
      // Count only messages from other user that are unread
      if (sender !== userId && !readBy.includes(userId)) {
        unreadCount++;
        //console.log(`📊 Unread message found: ${messageDoc.id} from ${sender}`);
      }
    });
    
    //console.log(`📊 Total unread count for chat ${chatId}: ${unreadCount}`);
    return unreadCount;
  } catch (error) {
    console.error('Error calculating unread count:', error);
    return 0;
  }
};

// Get user chats (one-to-one only)
export const getUserChats = (userId: string, callback: (chats: Chat[]) => void) => {
  const q = query(
    chatsCollection,
    where('participants', 'array-contains', userId)
  );
  
  return onSnapshot(q, async (snapshot) => {
    const chatsPromises = snapshot.docs.map(async (chatDoc) => {
      try {
        const chatData = chatDoc.data();
        
        // Skip group chats (though we're not creating them)
        if (chatData.isGroup) {
          return null;
        }
        
        const unreadCount = await calculateUnreadCount(chatDoc.id, userId);
        
        const chat = {
          id: chatDoc.id,
          ...chatData,
          unreadCount
        } as Chat;
        
        return chat;
      } catch (error) {
        console.error('Error processing chat:', chatDoc.id, error);
        return null;
      }
    });
    
    try {
      let chats = await Promise.all(chatsPromises);
      
      // Filter out null values and sort by timestamp
      chats = chats.filter(chat => chat !== null) as Chat[];
      
      chats = chats.sort((a, b) => {
        const timeA = a.lastMessageTimestamp?.toDate().getTime() || a.createdAt?.toDate().getTime() || 0;
        const timeB = b.lastMessageTimestamp?.toDate().getTime() || b.createdAt?.toDate().getTime() || 0;
        return timeB - timeA;
      });
      
      callback(chats);
    } catch (error) {
      console.error('Error processing chats:', error);
      callback([]);
    }
  }, (error) => {
    console.error('getUserChats listener error:', error);
  });
};

// Message operations - SIMPLIFIED FOR ONE-TO-ONE
// In your firestore.ts - UPDATED sendMessage function
export const sendMessage = async (chatId: string, message: Omit<Message, 'id' | 'timestamp' | 'status'>) => {
  try {
    const messagesRef = messagesCollection(chatId);
    
    // Get chat to know participants
    const chatRef = doc(firestore, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    const chatData = chatSnap.data() as Chat;
    
    const messageData = {
      text: message.text,
      sender: message.senderId,
      timestamp: serverTimestamp(),
      read: false,
      readBy: [message.senderId],
      status: 'sent',
      type: 'text',
    };
    
    const messageRef = await addDoc(messagesRef, messageData);
    
    // Update chat's last message
    await updateDoc(chatRef, {
      lastMessage: message.text,
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSender: message.senderId,
      lastMessageStatus: 'sent',
      updatedAt: serverTimestamp(),
    });

    // ✅ FIXED: Send push notification with proper data
    await sendMessageNotification(chatId, message.senderId, message.text, chatData);
    
    return messageRef;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// ✅ UPDATED: Enhanced notification function with proper data
const sendMessageNotification = async (
  chatId: string, 
  senderId: string, 
  messageText: string, 
  chatData: Chat
) => {
  try {
    console.log('🔔 [NOTIFICATION] Sending message notification...');
    
    // Find the receiver (other participant)
    const participants = chatData.participants || [];
    const receiverId = participants.find(pid => pid !== senderId);
    
    if (!receiverId) {
      console.log('❌ [NOTIFICATION] No receiver found');
      return;
    }

    // Get sender info for notification
    const senderDoc = await getDoc(doc(firestore, 'users', senderId));
    if (!senderDoc.exists()) {
      console.log('❌ [NOTIFICATION] Sender not found');
      return;
    }

    const senderData = senderDoc.data();
    const senderName = senderData.displayName || senderData.email?.split('@')[0] || 'Someone';

    // Get receiver info to check notification preferences
    const receiverDoc = await getDoc(doc(firestore, 'users', receiverId));
    if (!receiverDoc.exists()) {
      console.log('❌ [NOTIFICATION] Receiver not found');
      return;
    }

    const receiverData = receiverDoc.data();
    
    // Check if receiver has notifications enabled
    if (receiverData.notificationEnabled === false) {
      console.log('🔕 [NOTIFICATION] Notifications disabled for receiver');
      return;
    }

    // ✅ IMPORTANT: Prepare proper notification data for service worker
    const notificationData = {
      chatId: chatId,
      senderId: senderId,
      type: 'new_message',
      timestamp: new Date().toISOString(),
      // Add any additional data needed
      click_action: `/chat/${chatId}` // This helps some browsers
    };

    // Send push notification using your API
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: receiverData.fcmTokens?.[0],
        title: `💬 ${senderName}`,
        body: messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText,
        data: notificationData, // This goes to service worker
        // Also include in notification for some platforms
        click_action: `/chat/${chatId}`
      }),
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ [NOTIFICATION] Push notification sent to ${receiverData.displayName || 'receiver'}`);
    } else {
      console.log(`❌ [NOTIFICATION] Failed to send push: ${result.error}`);
      
      // Handle expired tokens
      if (result.code === 'messaging/registration-token-not-registered' || response.status === 410) {
        console.log('🔄 [NOTIFICATION] Removing expired token...');
        
        const updatedTokens = (receiverData.fcmTokens || []).filter((token: string) => 
          token !== receiverData.fcmTokens[0]
        );
        
        await updateDoc(doc(firestore, 'users', receiverId), {
          fcmTokens: updatedTokens
        });
        
        console.log('🗑️ [NOTIFICATION] Expired token removed');
      }
    }

  } catch (error) {
    console.error('❌ [NOTIFICATION] Error sending message notification:', error);
  }
};
export const getMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    messagesCollection(chatId),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const messages = snapshot.docs.map(messageDoc => {
      const data = messageDoc.data();
      return {
        id: messageDoc.id,
        text: data.text || '',
        senderId: data.sender || data.senderId,
        timestamp: data.timestamp,
        read: data.read || false,
        readBy: data.readBy || [],
        status: data.status || 'sent',
        type: data.type || 'text',
      } as Message;
    });
    
    callback(messages);
  });
};

// Real-time presence
export const updateUserPresence = async (userId: string, isOnline: boolean) => {
  try {
    const userRef = doc(firestore, 'users', userId);
    await updateDoc(userRef, {
      isOnline,
      lastSeen: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user presence:', error);
    throw error;
  }
};