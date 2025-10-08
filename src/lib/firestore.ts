// --- path: /src/lib/firestore.ts ---
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
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
    
    //console.log('Checking if user exists:', user.uid, 'Exists:', userSnap.exists());
    
    if (!userSnap.exists()) {
      //console.log('Creating new user profile:', user.uid);
      // Use setDoc instead of updateDoc for new documents
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
      //console.log('User profile created successfully');
    } else {
      //console.log('User already exists, updating profile');
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

// Chat operations - IMPROVED WITH EXISTING CHAT DETECTION
export const createChat = async (participants: string[], isGroup: boolean = false, groupName?: string) => {
  try {
    //console.log('🔧 Creating chat with participants:', participants);
    
    // Sort participants to ensure consistent chat ID generation
    const sortedParticipants = [...participants].sort();
    
    // Check if chat already exists between these exact users
    const existingChatsQuery = query(
      chatsCollection,
      where('participants', 'array-contains', sortedParticipants[0])
    );
    
    const existingChatsSnapshot = await getDocs(existingChatsQuery);
    //console.log('📋 Checking existing chats...');
    
    let existingChat: DocumentSnapshot | null = null;
    
    existingChatsSnapshot.forEach((doc) => {
      const chatData = doc.data();
      const chatParticipants = chatData.participants || [];
      
      // Check if both participants arrays have the same users (regardless of order)
      const hasAllParticipants = sortedParticipants.every(pid => 
        chatParticipants.includes(pid)
      );
      const sameLength = chatParticipants.length === sortedParticipants.length;
      
      if (hasAllParticipants && sameLength) {
        existingChat = doc;
        //console.log('✅ Found existing chat:', doc.id, 'with participants:', chatParticipants);
      }
    });
    
    if (existingChat) {
      //console.log('🎯 Using existing chat:', existingChat.id);
      return doc(firestore, 'chats', existingChat.id);
    }

    //console.log('🆕 Creating NEW chat for participants:', sortedParticipants);
    
    const chatData: any = {
      participants: sortedParticipants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isGroup,
    };

    if (isGroup && groupName) {
      chatData.groupName = groupName;
    }

    const chatRef = await addDoc(chatsCollection, chatData);
    //console.log('✅ NEW Chat created with ID:', chatRef.id, 'Participants:', sortedParticipants);
    
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
      //console.log(`✅ User chat created for: ${participantId}`);
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
    
    // ✅ FIX: Use different variable name to avoid conflict with 'doc' function
    for (const messageDoc of snapshot.docs) {
      const messageData = messageDoc.data();
      const readBy = messageData.readBy || [];
      const sender = messageData.sender || messageData.senderId;
      
      // Only mark messages from other users as read
      if (!readBy.includes(userId) && sender !== userId) {
        markedCount++;
        
        // ✅ FIX: Use messageDoc.id instead of doc.id
        const messageRef = doc(firestore, 'chats', chatId, 'messages', messageDoc.id);
        const newReadBy = [...readBy, userId];
        
        // Calculate if message is read by all participants
        const otherParticipants = participants.filter(pid => pid !== sender);
        const isReadByAll = newReadBy.length >= otherParticipants.length + 1; // +1 for sender
        
        batch.update(messageRef, {
          readBy: newReadBy,
          read: true,
          status: isReadByAll ? 'read' : 'delivered'
        });
        
        //console.log(`✅ Marking message ${messageDoc.id} as read`);
      }
    }
    
    if (markedCount > 0) {
      await batch.commit();
      //console.log(`🎯 Successfully marked ${markedCount} messages as read using batch`);
      
      // Update last message status in chat
      if (chatData.lastMessageSender && chatData.lastMessageSender !== userId) {
        await updateDoc(chatRef, {
          lastMessageStatus: 'read',
          updatedAt: serverTimestamp()
        });
      }
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
    
    // ✅ FIX: Use different variable name
    snapshot.docs.forEach(messageDoc => {
      const messageData = messageDoc.data();
      const readBy = messageData.readBy || [];
      const sender = messageData.sender || messageData.senderId;
      
      // Count only messages from other users that are unread
      if (sender !== userId && !readBy.includes(userId)) {
        unreadCount++;
      }
    });
    
    //console.log(`📊 Unread count for chat ${chatId}: ${unreadCount}`);
    return unreadCount;
  } catch (error) {
    console.error('Error calculating unread count:', error);
    return 0;
  }
};

// FIXED: Update getUserChats to handle index error temporarily
export const getUserChats = (userId: string, callback: (chats: Chat[]) => void) => {
  // TEMPORARY FIX: Remove orderBy to avoid index requirement until composite index is created
  const q = query(
    chatsCollection,
    where('participants', 'array-contains', userId)
    // Comment out orderBy until composite index is created in Firebase Console
    // orderBy('lastMessageTimestamp', 'desc')
  );
  
  return onSnapshot(q, async (snapshot) => {
    //console.log('🔄 getUserChats snapshot received:', snapshot.size, 'chats');
    
    const chatsPromises = snapshot.docs.map(async (chatDoc) => {
      try {
        const chatData = chatDoc.data();
        const unreadCount = await calculateUnreadCount(chatDoc.id, userId);
        
        const chat = {
          id: chatDoc.id,
          ...chatData,
          unreadCount
        } as Chat;
        
        
        
        return chat;
      } catch (error) {
        console.error('Error processing chat:', chatDoc.id, error);
        return {
          id: chatDoc.id,
          ...chatDoc.data(),
          unreadCount: 0
        } as Chat;
      }
    });
    
    try {
      let chats = await Promise.all(chatsPromises);
      
      // Manual client-side sorting as temporary solution
      chats = chats.sort((a, b) => {
        const timeA = a.lastMessageTimestamp?.toDate().getTime() || a.createdAt?.toDate().getTime() || 0;
        const timeB = b.lastMessageTimestamp?.toDate().getTime() || b.createdAt?.toDate().getTime() || 0;
        return timeB - timeA; // Descending order (newest first)
      });
      
      //console.log('🎯 All chats processed:', chats.length);
      callback(chats);
    } catch (error) {
      console.error('Error processing chats:', error);
      callback([]);
    }
  }, (error) => {
    console.error('❌ getUserChats listener error:', error);
    // If there's an error, try with a simpler query
    if (error.code === 'failed-precondition') {
      //console.log('🔄 Falling back to simpler query without ordering...');
      const fallbackQuery = query(
        chatsCollection,
        where('participants', 'array-contains', userId)
      );
      
      return onSnapshot(fallbackQuery, async (snapshot) => {
        const chats = snapshot.docs.map(chatDoc => ({
          id: chatDoc.id,
          ...chatDoc.data(),
          unreadCount: 0
        } as Chat));
        
        //console.log('🔄 Fallback query successful, chats loaded:', chats.length);
        callback(chats);
      });
    }
  });
};

// Message operations - UPDATED WITH READ RECEIPTS
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
      senderName: 'User',
      timestamp: serverTimestamp(),
      read: false,
      readBy: [message.senderId], // Sender automatically reads their own message
      deliveredTo: [message.senderId], // Sender automatically receives their own message
      status: 'sent', // Initial status
      type: 'text',
    };
    
    const messageRef = await addDoc(messagesRef, messageData);
    
    // Update chat's last message with status
    await updateDoc(chatRef, {
      lastMessage: message.text,
      lastMessageTimestamp: serverTimestamp(),
      lastMessageSender: message.senderId,
      lastMessageStatus: 'sent',
      updatedAt: serverTimestamp(),
    });
    
    //console.log('✅ Message sent with ID:', messageRef.id, 'Status: sent');
    
    // Mark as delivered to other participants (simulate delivery)
    setTimeout(async () => {
      try {
        await markMessageAsDelivered(chatId, messageRef.id, chatData.participants || []);
      } catch (error) {
        console.error('Error marking message as delivered:', error);
      }
    }, 1000);
    
    return messageRef;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Mark message as delivered to all participants
export const markMessageAsDelivered = async (chatId: string, messageId: string, participants: string[]) => {
  try {
    const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (messageSnap.exists()) {
      const messageData = messageSnap.data();
      const deliveredTo = messageData.deliveredTo || [];
      
      // Add all participants to delivered list
      const newDeliveredTo = [...new Set([...deliveredTo, ...participants])];
      
      // Calculate if message is delivered to all participants
      const isDeliveredToAll = newDeliveredTo.length === participants.length;
      
      await updateDoc(messageRef, {
        deliveredTo: newDeliveredTo,
        status: isDeliveredToAll ? 'delivered' : 'sent'
      });
      
      //console.log('📨 Message marked as delivered to:', newDeliveredTo, 'Status:', isDeliveredToAll ? 'delivered' : 'sent');
      
      // Update chat's last message status if this is the last message
      const chatRef = doc(firestore, 'chats', chatId);
      const chatSnap = await getDoc(chatRef);
      const chatData = chatSnap.data() as Chat;
      
      if (messageId === chatData.lastMessageSender) {
        await updateDoc(chatRef, {
          lastMessageStatus: isDeliveredToAll ? 'delivered' : 'sent'
        });
      }
    }
  } catch (error) {
    console.error('Error marking message as delivered:', error);
    throw error;
  }
};

// ✅ UPDATED: Improved markMessageAsRead for better real-time updates
export const markMessageAsRead = async (chatId: string, messageId: string, userId: string) => {
  try {
    const messageRef = doc(firestore, 'chats', chatId, 'messages', messageId);
    const messageSnap = await getDoc(messageRef);
    
    if (messageSnap.exists()) {
      const messageData = messageSnap.data();
      const readBy = messageData.readBy || [];
      
      if (!readBy.includes(userId)) {
        const newReadBy = [...readBy, userId];
        
        // Get chat to know total participants
        const chatRef = doc(firestore, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        const chatData = chatSnap.data() as Chat;
        const participants = chatData.participants || [];
        
        // Calculate if message is read by all participants (excluding sender)
        const otherParticipants = participants.filter(pid => pid !== messageData.sender);
        const isReadByAll = newReadBy.length >= otherParticipants.length + 1; // +1 for sender
        
        // Update message status immediately
        await updateDoc(messageRef, {
          readBy: newReadBy,
          read: true,
          status: isReadByAll ? 'read' : 'delivered'
        });
        
        //console.log('👀 Message marked as read by:', userId, 'Status:', isReadByAll ? 'read' : 'delivered');
        
        // Update chat's last message status if this is the last message
        const chatDoc = await getDoc(chatRef);
        const currentChatData = chatDoc.data() as Chat;
        
        if (currentChatData.lastMessageSender === messageData.sender && 
            messageId === currentChatData.lastMessageSender) {
          await updateDoc(chatRef, {
            lastMessageStatus: isReadByAll ? 'read' : 'delivered',
            updatedAt: serverTimestamp()
          });
        }
      }
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
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
        deliveredTo: data.deliveredTo || [],
        status: data.status || 'sent',
        type: data.type || 'text',
        senderName: data.senderName,
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