// app/api/send-notification/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Firebase Admin setup
let admin: any;

try {
  admin = require('firebase-admin');
} catch (error) {
  console.log('Firebase Admin not available in browser');
}

// Initialize Firebase Admin only on server
if (admin && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, notification, data } = await request.json();

    console.log('📤 Sending notification to:', token?.substring(0, 20) + '...');

    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Firebase Admin not available' },
        { status: 500 }
      );
    }

    // Simple message payload
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
        click_action: data?.click_action || process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'
      },
      webpush: {
        fcm_options: {
          link: data?.click_action || process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'
        }
      }
    };

    console.log('📨 Sending FCM message to:', token.substring(0, 20) + '...');

    // Send message using Firebase Admin
    const response = await admin.messaging().send(message);
    
    console.log('✅ FCM notification sent successfully');

    return NextResponse.json({ 
      success: true, 
      messageId: response 
    });

  } catch (error: any) {
    console.error('❌ Error sending notification:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send notification',
        details: error.message
      },
      { status: 500 }
    );
  }
}