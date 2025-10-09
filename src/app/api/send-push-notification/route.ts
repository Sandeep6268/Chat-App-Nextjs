// app/api/send-push-notification/route.ts - NEW FILE
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Firebase Admin will be initialized lazily
let admin: any = null;

const initializeAdmin = () => {
  if (!admin) {
    admin = require('firebase-admin');
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }
  return admin;
};

export async function POST(request: NextRequest) {
  try {
    const { targetUserId, title, body, data } = await request.json();

    console.log('🚀 API: Sending push notification to user:', targetUserId);

    // Get FCM token from Firestore
    const db = getFirestore();
    const tokenDoc = await getDoc(doc(db, 'fcm_tokens', targetUserId));
    
    if (!tokenDoc.exists()) {
      console.log('❌ API: No FCM token found for user:', targetUserId);
      return NextResponse.json(
        { error: 'No FCM token found for user' },
        { status: 404 }
      );
    }

    const userToken = tokenDoc.data().token;
    console.log('✅ API: Found FCM token for user:', targetUserId);

    // Initialize Firebase Admin
    const admin = initializeAdmin();

    // Send push notification
    const message = {
      token: userToken,
      notification: {
        title,
        body,
      },
      data: data || {},
      webpush: {
        fcmOptions: {
          link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app'}/chat/${data?.chatId || ''}`,
        },
      },
    };

    console.log('📤 API: Sending FCM message...');
    const response = await admin.messaging().send(message);
    console.log('✅ API: Push notification sent successfully:', response);

    return NextResponse.json({
      success: true,
      messageId: response,
    });

  } catch (error: any) {
    console.error('❌ API: Error sending push notification:', error);
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to send notification',
        code: error.code || 'UNKNOWN_ERROR'
      },
      { status: 500 }
    );
  }
}