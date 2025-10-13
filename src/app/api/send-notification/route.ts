// app/api/send-notification/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Firebase Admin setup with proper types
interface FirebaseAdmin {
  apps: any[];
  initializeApp: (config: any) => void;
  messaging: () => {
    send: (message: any) => Promise<string>;
  };
  credential: {
    cert: (cert: {
      projectId: string;
      clientEmail: string;
      privateKey: string;
    }) => any;
  };
}

let admin: FirebaseAdmin | null = null;

try {
  // Use dynamic import to avoid require
  admin = await import('firebase-admin').then(mod => mod.default);
} catch (error) {
  console.log('Firebase Admin not available in browser');
}

// Initialize Firebase Admin only on server
if (admin && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    console.error('❌ Firebase Admin initialization failed:', err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, notification, data } = await request.json();

    console.log('📤 Sending notification to token:', token?.substring(0, 20) + '...');

    if (!token) {
      console.log('❌ No FCM token provided');
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }

    if (!admin) {
      console.log('❌ Firebase Admin not available');
      return NextResponse.json(
        { error: 'Firebase Admin not available' },
        { status: 500 }
      );
    }

    const message = {
      token: token,
      notification: {
        title: notification?.title || 'New Message',
        body: notification?.body || 'You have a new message',
      },
      data: {
        chatId: data?.chatId || '',
        senderName: data?.senderName || 'Unknown',
        message: data?.message || '',
        click_action: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${data?.chatId}`
      },
      webpush: {
        fcm_options: {
          link: `${process.env.NEXT_PUBLIC_APP_URL}/chat/${data?.chatId}`
        },
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    console.log('📨 Sending FCM message...');

    const response = await admin.messaging().send(message);
    
    console.log('✅ FCM notification sent successfully, message ID:', response);

    return NextResponse.json({ 
      success: true, 
      messageId: response 
    });

  } catch (error: unknown) {
    console.error('❌ Error sending notification:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as { code?: string }).code;
    
    // More specific error logging
    if (errorCode === 'messaging/registration-token-not-registered') {
      console.error('🔴 FCM token no longer valid - user needs to refresh token');
    } else if (errorCode === 'messaging/invalid-argument') {
      console.error('🔴 Invalid FCM token format');
    } else if (errorCode === 'messaging/internal-error') {
      console.error('🔴 Internal FCM server error');
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to send notification',
        details: errorMessage,
        code: errorCode
      },
      { status: 500 }
    );
  }
}