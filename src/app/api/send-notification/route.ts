import { NextRequest, NextResponse } from 'next/server';

// Firebase Admin SDK setup (server-side)
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, title, body: messageBody, data } = body;

    console.log('📤 Sending push notification:', { token, title, messageBody });

    // Validate input
    if (!token || !title || !messageBody) {
      return NextResponse.json(
        { error: 'Missing required fields: token, title, body' },
        { status: 400 }
      );
    }

    // Prepare notification payload
    const message = {
      token: token,
      notification: {
        title: title,
        body: messageBody,
      },
      data: data || {},
      webpush: {
        notification: {
          icon: '/icon-192.png',
          badge: '/badge.png',
          requireInteraction: true,
        },
        fcmOptions: {
          link: '/', // App URL when notification is clicked
        },
      },
      android: {
        notification: {
          icon: '/icon-192.png',
          color: '#10B981',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    // Send notification using Firebase Admin
    const response = await admin.messaging().send(message);
    
    console.log('✅ Push notification sent successfully:', response);
    
    return NextResponse.json({
      success: true,
      messageId: response,
      message: 'Push notification sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Error sending push notification:', error);
    
    // Handle specific FCM errors
    if (error.code === 'messaging/registration-token-not-registered') {
      return NextResponse.json(
        { error: 'Token is no longer valid. Please refresh token.' },
        { status: 410 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send push notification: ' + error.message },
      { status: 500 }
    );
  }
}

// Send to multiple tokens
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokens, title, body: messageBody, data } = body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid tokens array' },
        { status: 400 }
      );
    }

    const message = {
      tokens: tokens, // Array of tokens
      notification: {
        title: title,
        body: messageBody,
      },
      data: data || {},
      webpush: {
        notification: {
          icon: '/icon-192.png',
          badge: '/badge.png',
          requireInteraction: true,
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log('✅ Multicast notification sent:', {
      successCount: response.successCount,
      failureCount: response.failureCount
    });

    return NextResponse.json({
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses
    });

  } catch (error: any) {
    console.error('❌ Error sending multicast notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notifications: ' + error.message },
      { status: 500 }
    );
  }
}