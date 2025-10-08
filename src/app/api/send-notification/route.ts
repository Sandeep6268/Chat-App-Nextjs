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

  // Use your exact service account credentials
  const serviceAccount = {
    type: "service_account",
    project_id: "whatsapp-clone-69386",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID, // Optional: Add this to Vercel if available
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: "firebase-adminsdk-fbsvc@whatsapp-clone-69386.iam.gserviceaccount.com",
    client_id: process.env.FIREBASE_CLIENT_ID, // Optional
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL || `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40whatsapp-clone-69386.iam.gserviceaccount.com`
  };

  console.log('🔧 Initializing Firebase Admin with:', {
    project_id: serviceAccount.project_id,
    client_email: serviceAccount.client_email,
    has_private_key: !!serviceAccount.private_key
  });

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
      projectId: "whatsapp-clone-69386"
    });

    console.log('✅ Firebase Admin initialized successfully');
    return app;
  } catch (error: any) {
    console.error('❌ Firebase Admin initialization failed:', error.message);
    
    // Alternative initialization without full service account
    try {
      console.log('🔄 Trying alternative initialization...');
      const app = admin.initializeApp({
        projectId: "whatsapp-clone-69386"
      });
      console.log('✅ Firebase Admin initialized with project ID only');
      return app;
    } catch (fallbackError: any) {
      console.error('❌ Fallback initialization also failed:', fallbackError.message);
      throw error;
    }
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
          error: 'Firebase Admin initialization failed',
          message: 'Please check Firebase Admin configuration',
          details: process.env.NODE_ENV === 'development' ? initError.message : undefined
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
      messageBody_length: messageBody?.length
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

    // Prepare the message payload
    const message = {
      token: token,
      notification: {
        title: title,
        body: messageBody,
      },
      data: {
        ...(data || {}),
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app'
      },
      webpush: {
        headers: {
          Urgency: 'high'
        },
        notification: {
          icon: '/icon-192.png',
          badge: '/badge.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
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
      console.error('❌ FCM send error:', fcmError);
      
      // Handle specific FCM errors
      let errorMessage = 'Failed to send push notification';
      let statusCode = 500;

      if (fcmError.code) {
        switch (fcmError.code) {
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
          case 'messaging/invalid-argument':
            errorMessage = 'Invalid argument provided to FCM.';
            statusCode = 400;
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
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Test endpoint to verify Firebase Admin setup
export async function GET() {
  try {
    const admin = require('firebase-admin');
    
    try {
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
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'Firebase Admin not available',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}