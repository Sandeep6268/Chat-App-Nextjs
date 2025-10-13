// --- path: /src/types/index.ts ---
import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  createdAt?: Timestamp;
  lastSeen?: Timestamp;
  isOnline?: boolean;
  fcmToken?: string; // ADD THIS
  fcmTokenUpdatedAt?: Timestamp; // ADD THIS
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  timestamp: Timestamp;
  read: boolean;
  readBy?: string[]; // Users who have read the message
  deliveredTo?: string[]; // Users who have received the message
  status: 'sent' | 'delivered' | 'read'; // Message status
  imageUrl?: string;
  // For image messages
  imagePath?: string;
  // For future features
  replyTo?: string;
  type: 'text' | 'image' | 'system';
}

export interface Chat {
  id: string;
  participants: string[];
  participantData?: { [uid: string]: { displayName: string; photoURL: string | null } };
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  lastMessageSender?: string;
  lastMessageStatus?: 'sent' | 'delivered' | 'read'; // Chat-level status
  unreadCount?: number; // Unread message count
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Remove group chat properties since we only want one-to-one
  isGroup?: boolean; // Keep but always false
}

export interface UserChat {
  chatId: string;
  userId: string;
  lastRead: Timestamp;
  muted: boolean;
  archived: boolean;
}

// Helper type for Firestore document with ID
export type FirestoreDocument<T> = T & { id: string };