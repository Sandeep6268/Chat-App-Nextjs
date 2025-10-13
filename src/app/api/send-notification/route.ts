// app/api/send-notification/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, notification, data } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'FCM token is required' },
        { status: 400 }
      );
    }

    // Send notification using Firebase Admin SDK (server-side)
    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        image: data?.imageUrl,
      },
      data: {
        ...data,
        click_action: data.click_action || process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'
      },
      webpush: {
        fcm_options: {
          link: data.click_action || process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com'
        },
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          requireInteraction: true,
        }
      },
      android: {
        priority: 'high',
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

    // Use Firebase Admin to send message
    const admin = await getFirebaseAdmin();
    const response = await admin.messaging().send(message);

    return NextResponse.json({ 
      success: true, 
      messageId: response 
    });
  } catch (error: any) {
    console.error('❌ Error sending notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}

// Firebase Admin initialization
async function getFirebaseAdmin() {
  const admin = await import('firebase-admin');
  
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  
  return admin;
}