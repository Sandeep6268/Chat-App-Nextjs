import { NextRequest, NextResponse } from 'next/server';

// Firebase Admin SDK initialization
const initializeFirebaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Firebase Admin can only be used on server side');
  }

  const admin = require('firebase-admin');
  
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccount = {
    type: "service_account",
    project_id: "whatsapp-clone-69386",
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: "firebase-adminsdk-fbsvc@whatsapp-clone-69386.iam.gserviceaccount.com",
  };

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
      projectId: "whatsapp-clone-69386"
    });

    console.log('✅ Firebase Admin initialized successfully');
    return app;
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  console.log('🚀 Starting push notification request...');
  
  try {
    // Initialize Firebase Admin
    const admin = require('firebase-admin');
    let app;
    
    try {
      app = initializeFirebaseAdmin();
    } catch (initError: any) {
      console.error('❌ Firebase Admin initialization failed:', initError.message);
      return NextResponse.json(
        { 
          success: false,
          error: 'Firebase Admin initialization failed'
        },
        { status: 500 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid JSON in request body'
        },
        { status: 400 }
      );
    }

    const { token, title, body: messageBody, data } = body;

    console.log('📤 Processing notification:', {
      token_length: token?.length,
      title,
      messageBody
    });

    // Validate required fields
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required field: token'
        },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required field: title'
        },
        { status: 400 }
      );
    }

    if (!messageBody) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required field: body'
        },
        { status: 400 }
      );
    }

    // ✅ FIXED: Simple and valid FCM payload
    const message = {
      token: token,
      notification: {
        title: title.substring(0, 50), // Limit title length
        body: messageBody.substring(0, 150), // Limit body length
        icon: '/icon-192.png',
        // sound: 'default' // Optional
      },
      data: {
        // Simple data payload - only strings
        type: data?.type || 'general',
        chatId: data?.chatId || '',
        senderId: data?.senderId || '',
        timestamp: new Date().toISOString(),
        click_action: 'OPEN_CHAT', // Important for web
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app'
      },
      webpush: {
        fcmOptions: {
          link: process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app',
        },
      }
    };

    console.log('📨 Sending FCM message...', {
      title: message.notification.title,
      body: message.notification.body
    });
    
    try {
      // Send the message
      const response = await admin.messaging().send(message);
      
      console.log('✅ Push notification sent successfully. Message ID:', response);
      
      return NextResponse.json({
        success: true,
        messageId: response,
        message: 'Push notification sent successfully'
      });

    } catch (fcmError: any) {
      console.error('❌ FCM send error:', {
        code: fcmError.code,
        message: fcmError.message,
        details: fcmError.details
      });
      
      let errorMessage = 'Failed to send push notification';
      let statusCode = 500;

      if (fcmError.code) {
        switch (fcmError.code) {
          case 'messaging/invalid-payload':
            errorMessage = 'Invalid notification payload. Please check the data format.';
            statusCode = 400;
            break;
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
            errorMessage = `FCM Error: ${fcmError.code}`;
        }
      }

      return NextResponse.json(
        { 
          success: false,
          error: errorMessage,
          code: fcmError.code,
          details: process.env.NODE_ENV === 'development' ? fcmError.message : undefined
        },
        { status: statusCode }
      );
    }

  } catch (error: any) {
    console.error('❌ Unexpected error in push notification API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}

// Test endpoint
export async function GET() {
  try {
    const admin = require('firebase-admin');
    initializeFirebaseAdmin();
    
    return NextResponse.json({
      success: true,
      status: 'Firebase Admin is configured correctly',
      projectId: "whatsapp-clone-69386",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'Firebase Admin configuration error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}