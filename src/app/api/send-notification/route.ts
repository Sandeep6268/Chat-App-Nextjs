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

    // ✅ IMPROVED TOKEN VALIDATION
    if (!token) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing FCM token'
        },
        { status: 400 }
      );
    }

    // Validate token format
    if (typeof token !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid token format: must be a string'
        },
        { status: 400 }
      );
    }

    if (token.length < 50 || token.length > 500) {
      return NextResponse.json(
        { 
          success: false,
          error: `Invalid token length: ${token.length}. Expected 50-500 characters.`
        },
        { status: 400 }
      );
    }

    // Basic token format check (FCM tokens usually start with specific patterns)
    if (!token.startsWith('f') && !token.includes(':')) {
      console.warn('⚠️ Token format might be invalid');
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

    // ✅ SIMPLIFIED PAYLOAD - Minimum required fields only
    const message = {
      token: token.trim(), // Trim any whitespace
      notification: {
        title: title.substring(0, 100), // Safe limit
        body: messageBody.substring(0, 200), // Safe limit
      },
      // Remove all optional fields that might cause issues
    };

    console.log('📨 Sending FCM message with token:', token.substring(0, 20) + '...');
    
    try {
      // Send the message
      const response = await admin.messaging().send(message);
      
      console.log('✅ Push notification sent successfully. Message ID:', response);
      
      return NextResponse.json({
        success: true,
        messageId: response,
        message: 'Push notification sent successfully'
      });

    }  catch (fcmError: any) {
  console.error('❌ FCM send error:', {
    code: fcmError.code,
    message: fcmError.message
  });
  
  let errorMessage = 'Failed to send push notification';
  let statusCode = 500;

  if (fcmError.code) {
    switch (fcmError.code) {
      case 'messaging/invalid-argument':
        errorMessage = 'Invalid FCM token.';
        statusCode = 400;
        break;
      case 'messaging/registration-token-not-registered':
        errorMessage = 'FCM token is no longer valid.';
        statusCode = 410; // Use 410 Gone for expired tokens
        break;
      case 'messaging/invalid-registration-token':
        errorMessage = 'Invalid registration token.';
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
    },
    { status: statusCode }
  );
}

  } catch (error: any) {
    console.error('❌ Unexpected error in push notification API:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const admin = require('firebase-admin');
    initializeFirebaseAdmin();
    
    return NextResponse.json({
      success: true,
      status: 'Firebase Admin is configured correctly',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'Firebase Admin configuration error',
      error: error.message
    }, { status: 500 });
  }
}