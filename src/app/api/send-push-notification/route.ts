// app/api/send-push-notification/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Firebase Admin setup
const initializeAdmin = () => {
  try {
    const admin = require('firebase-admin');
    
    if (!admin.apps.length) {
      console.log('🔥 [FCM API] Initializing Firebase Admin...');
      
      // Check if environment variables are available
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
        throw new Error('Missing Firebase Admin environment variables');
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ [FCM API] Firebase Admin initialized successfully');
    }
    
    return admin;
  } catch (error) {
    console.error('❌ [FCM API] Firebase Admin initialization failed:', error);
    throw error;
  }
};

export async function POST(request: NextRequest) {
  console.log('📨 [FCM API] Received push notification request');
  
  try {
    const { targetUserId, title, body, data } = await request.json();

    console.log('🎯 [FCM API] Target user:', targetUserId);
    console.log('✉️ [FCM API] Message details:', { title, body, data });

    // Validate input
    if (!targetUserId || !title || !body) {
      console.error('❌ [FCM API] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields: targetUserId, title, body' },
        { status: 400 }
      );
    }

    // Get FCM token from Firestore
    console.log('🔍 [FCM API] Looking up FCM token for user:', targetUserId);
    const db = getFirestore();
    const tokenDoc = await getDoc(doc(db, 'fcm_tokens', targetUserId));
    
    if (!tokenDoc.exists()) {
      console.error('❌ [FCM API] No FCM token found for user:', targetUserId);
      return NextResponse.json(
        { 
          error: 'No FCM token found for user',
          suggestion: 'User needs to enable notifications on their device first'
        },
        { status: 404 }
      );
    }

    const userData = tokenDoc.data();
    const userToken = userData.token;
    
    if (!userToken) {
      console.error('❌ [FCM API] Token is empty for user:', targetUserId);
      return NextResponse.json(
        { error: 'FCM token is empty for user' },
        { status: 400 }
      );
    }

    console.log('✅ [FCM API] Found FCM token for user:', targetUserId);
    console.log('🔑 [FCM API] Token preview:', userToken.substring(0, 20) + '...');

    // Initialize Firebase Admin
    const admin = initializeAdmin();

    // Prepare FCM message
    const message = {
      token: userToken,
      notification: {
        title: title,
        body: body,
      },
      data: data || {},
      webpush: {
        fcmOptions: {
          link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app'}/chat/${data?.chatId || ''}`,
        },
      },
    };

    console.log('📤 [FCM API] Sending FCM message...');
    
    // Send push notification
    const response = await admin.messaging().send(message);
    
    console.log('✅ [FCM API] Push notification sent successfully');
    console.log('🎯 [FCM API] Message ID:', response);

    return NextResponse.json({
      success: true,
      messageId: response,
      sentAt: new Date().toISOString(),
      targetUserId: targetUserId
    });

  } catch (error: any) {
    console.error('💥 [FCM API] Error sending push notification:', {
      message: error.message,
      code: error.code,
      details: error
    });
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send push notification',
        details: error.message,
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}