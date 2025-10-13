// types/index.ts
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
  fcmToken?: string;
  fcmTokenUpdatedAt?: Timestamp;
}

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName?: string;
  timestamp: Timestamp;
  read: boolean;
  readBy: string[];
  status: 'sent' | 'delivered' | 'read';
  type: 'text';
}

export interface Chat {
  id: string;
  participants: string[];
  participantNames?: { [uid: string]: string };
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  lastMessageSender?: string;
  unreadCount?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}