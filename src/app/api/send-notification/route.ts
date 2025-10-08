import { NextRequest, NextResponse } from 'next/server';

// Firebase Admin SDK initialization
const initializeFirebaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin can only be used on server side');
  }

  try {
    const admin = require('firebase-admin');
    
    if (admin.apps.length > 0) {
      return admin.app();
    }

    // For Vercel environment, we need to use environment variables directly
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
      universe_domain: "googleapis.com"
    };

    // Validate required environment variables
    if (!serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Missing Firebase Admin environment variables');
    }

    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });

    console.log('✅ Firebase Admin initialized successfully');
    return app;
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting push notification request...');
    
    // Initialize Firebase Admin
    const admin = require('firebase-admin');
    let app;
    try {
      app = initializeFirebaseAdmin();
    } catch (initError) {
      console.error('❌ Firebase Admin init error:', initError);
      return NextResponse.json(
        { 
          error: 'Firebase Admin initialization failed',
          details: process.env.NODE_ENV === 'development' ? initError.message : 'Internal server error'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { token, title, body: messageBody, data } = body;

    console.log('📤 Sending push notification to token:', token?.substring(0, 20) + '...');

    // Validate input
    if (!token || !title || !messageBody) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          required: ['token', 'title', 'body'],
          received: { token: !!token, title: !!title, body: !!messageBody }
        },
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
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        sound: 'default'
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          icon: '/icon-192.png',
          badge: '/badge.png',
          requireInteraction: true,
          vibrate: [200, 100, 200],
        },
        fcmOptions: {
          link: process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app',
        },
      },
      android: {
        priority: 'high',
        notification: {
          icon: 'icon-192.png',
          color: '#10B981',
          sound: 'default',
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

    console.log('📨 Sending FCM message...');
    
    // Send notification using Firebase Admin
    const response = await admin.messaging().send(message);
    
    console.log('✅ Push notification sent successfully. Message ID:', response);
    
    return NextResponse.json({
      success: true,
      messageId: response,
      message: 'Push notification sent successfully'
    });

  } catch (error: any) {
    console.error('❌ Error sending push notification:', error);
    
    // Handle specific FCM errors
    let errorMessage = 'Failed to send push notification';
    let statusCode = 500;

    if (error.code) {
      switch (error.code) {
        case 'messaging/registration-token-not-registered':
          errorMessage = 'Token is no longer valid. Please refresh token.';
          statusCode = 410;
          break;
        case 'messaging/invalid-registration-token':
          errorMessage = 'Invalid registration token.';
          statusCode = 400;
          break;
        case 'messaging/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          statusCode = 429;
          break;
        default:
          errorMessage = `FCM Error: ${error.code}`;
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        code: error.code,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: statusCode }
    );
  }
}

// Health check endpoint
export async function GET() {
  try {
    const admin = require('firebase-admin');
    initializeFirebaseAdmin();
    
    return NextResponse.json({
      status: 'healthy',
      message: 'Push notification API is working',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        error: 'Firebase Admin not configured properly',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}