// app/api/send-push-notification/route.ts - FCM ONLY
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Firebase Admin lazy initialization
let admin: any = null;

const initializeAdmin = () => {
  if (!admin) {
    admin = require('firebase-admin');
    
    if (!admin.apps.length) {
      console.log('🔥 [FCM API] Initializing Firebase Admin...');
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ [FCM API] Firebase Admin initialized');
    }
  }
  return admin;
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
        { error: 'No FCM token found for user' },
        { status: 404 }
      );
    }

    const userToken = tokenDoc.data().token;
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
          link: `${process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.vercel.app'}/chat/${data?.chatId || ''}`,
        },
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          actions: [
            {
              action: 'open',
              title: 'Open Chat'
            }
          ]
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

    console.log('📤 [FCM API] Sending FCM message...');
    
    // Send push notification
    const response = await admin.messaging().send(message);
    
    console.log('✅ [FCM API] Push notification sent successfully:', response);
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
      stack: error.stack
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to send push notification',
        details: error.message,
        code: error.code
      },
      { status: 500 }
    );
  }
}