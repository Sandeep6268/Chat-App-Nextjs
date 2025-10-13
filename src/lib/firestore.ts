// lib/firestore.ts
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
  writeBatch,
  limit
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Chat, Message, User } from '@/types';

// Collection references
export const usersCollection = collection(firestore, 'users');
export const chatsCollection = collection(firestore, 'chats');

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
        fcmToken: null,
        fcmTokenUpdatedAt: null,
      });
      console.log('✅ New user profile created:', user.uid);
    } else {
      await updateDoc(userRef, {
        lastSeen: serverTimestamp(),
        isOnline: true,
      });
      console.log('✅ User profile updated:', user.uid);
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

// Chat operations - STRICTLY ONE-TO-ONE ONLY
export const createChat = async (user1Id: string, user2Id: string) => {
  try {
    // Sort participants to ensure consistent chat ID
    const participants = [user1Id, user2Id].sort();
    
    // Check if chat already exists between these two users
    const existingChatQuery = query(
      chatsCollection,
      where('participants', '==', participants),
      limit(1)
    );
    
    const existingChatSnapshot = await getDocs(existingChatQuery);
    
    if (!existingChatSnapshot.empty) {
      const existingChat = existingChatSnapshot.docs[0];
      console.log('✅ Existing chat found:', existingChat.id);
      return doc(firestore, 'chats', existingChat.id);
    }

    // Create new one-to-one chat
    const chatData = {
      participants: participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSender: '',
      isGroup: false, // Explicitly mark as one-to-one
    };

    const chatRef = await addDoc(chatsCollection, chatData);
    console.log('✅ New one-to-one chat created:', chatRef.id);
    
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
    console.log('📖 Marking messages as read for user:', userId, 'in chat:', chatId);
    
    const messagesRef = messagesCollection(chatId);
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(messagesQuery);
    
    let markedCount = 0;
    const batch = writeBatch(firestore);
    
    for (const messageDoc of snapshot.docs) {
      const messageData = messageDoc.data();
      const readBy = messageData.readBy || [];
      const senderId = messageData.senderId;
      
      // Only mark messages from other user as read
      if (!readBy.includes(userId) && senderId !== userId) {
        markedCount++;
        
        const messageRef = doc(firestore, 'chats', chatId, 'messages', messageDoc.id);
        batch.update(messageRef, {
          readBy: [...readBy, userId],
          read: true,
          status: 'read'
        });
      }
    }
    
    if (markedCount > 0) {
      await batch.commit();
      console.log(`✅ Marked ${markedCount} messages as read`);
    } else {
      console.log('ℹ️ No messages to mark as read');
    }
    
  } catch (error) {
    console.error('❌ Error in markAllMessagesAsRead:', error);
    throw error;
  }
};



// Get user chats - ONE-TO-ONE ONLY
export const getUserChats = (userId: string, callback: (chats: Chat[]) => void) => {
  const q = query(
    chatsCollection,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    const chatsPromises = snapshot.docs.map(async (chatDoc) => {
      try {
        const chatData = chatDoc.data();
        
        // Skip if this is a group chat (shouldn't exist in our app)
        if (chatData.isGroup) {
          return null;
        }
        
        const unreadCount = await calculateUnreadCount(chatDoc.id, userId);
        
        const chat = {
          id: chatDoc.id,
          ...chatData,
          unreadCount,
          isGroup: false // Ensure it's marked as one-to-one
        } as Chat;
        
        return chat;
      } catch (error) {
        console.error('Error processing chat:', chatDoc.id, error);
        return null;
      }
    });
    
    try {
      let chats = await Promise.all(chatsPromises);
      chats = chats.filter(chat => chat !== null) as Chat[];
      console.log(`📋 Processed ${chats.length} one-to-one chats for user:`, userId);
      callback(chats);
    } catch (error) {
      console.error('Error processing chats:', error);
      callback([]);
    }
  }, (error) => {
    console.error('getUserChats listener error:', error);
  });
};

export const calculateUnreadCount = async (chatId: string, userId: string): Promise<number> => {
  try {
    const messagesRef = messagesCollection(chatId);
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'));
    
    const snapshot = await getDocs(messagesQuery);
    let unreadCount = 0;
    
    snapshot.docs.forEach(messageDoc => {
      const messageData = messageDoc.data();
      const readBy = messageData.readBy || [];
      const senderId = messageData.senderId;
      
      // Count only messages from other user that are unread
      if (senderId !== userId && !readBy.includes(userId)) {
        unreadCount++;
      }
    });
    
    console.log(`📊 Calculated ${unreadCount} unread messages for user ${userId} in chat ${chatId}`);
    return unreadCount;
  } catch (error) {
    console.error('Error calculating unread count:', error);
    return 0;
  }
};

// Update the sendMessage function to ensure unread count updates
export const sendMessage = async (chatId: string, messageData: {
  text: string;
  senderId: string;
  senderName?: string;
}) => {
  try {
    const messagesRef = messagesCollection(chatId);
    
    // Create message
    const message = {
      text: messageData.text,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      timestamp: serverTimestamp(),
      read: false,
      readBy: [messageData.senderId], // Sender has read their own message
      status: 'sent',
      type: 'text' as const,
    };
    
    const messageRef = await addDoc(messagesRef, message);
    
    // Update chat's last message info
    const chatRef = doc(firestore, 'chats', chatId);
    await updateDoc(chatRef, {
      lastMessage: messageData.text,
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSender: messageData.senderId,
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Message sent:', messageRef.id);
    
    // Force unread count recalculation by triggering a chat update
    setTimeout(async () => {
      try {
        const chatDoc = await getDoc(chatRef);
        if (chatDoc.exists()) {
          console.log('🔄 Triggering chat update for unread count recalculation');
        }
      } catch (error) {
        console.error('Error triggering chat update:', error);
      }
    }, 1000);
    
    return messageRef;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getMessages = (chatId: string, callback: (messages: Message[]) => void) => {
  const q = query(
    messagesCollection(chatId),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(messageDoc => {
      const data = messageDoc.data();
      return {
        id: messageDoc.id,
        text: data.text || '',
        senderId: data.senderId,
        senderName: data.senderName,
        timestamp: data.timestamp,
        read: data.read || false,
        readBy: data.readBy || [],
        status: data.status || 'sent',
        type: data.type || 'text',
      } as Message;
    });
    
    console.log(`📨 ${messages.length} messages loaded for chat:`, chatId);
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
  }
};

// Get other user from chat
export const getOtherUserFromChat = async (chat: Chat, currentUserId: string): Promise<User | null> => {
  try {
    const otherUserId = chat.participants.find(pid => pid !== currentUserId);
    if (!otherUserId) {
      console.log('❌ No other user found in chat');
      return null;
    }
    
    const userRef = doc(firestore, 'users', otherUserId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = { id: userSnap.id, ...userSnap.data() } as User;
      console.log('✅ Found other user:', userData.displayName || userData.email);
      return userData;
    }
    
    console.log('❌ Other user document not found:', otherUserId);
    return null;
  } catch (error) {
    console.error('Error getting other user:', error);
    return null;
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const userRef = doc(firestore, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as User;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};