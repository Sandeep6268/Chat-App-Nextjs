import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { recipientId, senderName, messageText, chatId, senderId, type } = await request.json();

    console.log('📨 Received notification request:', {
      recipientId,
      senderName,
      messageText: messageText?.substring(0, 50),
      chatId,
      type
    });

    if (!recipientId || !chatId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Dynamically import Firebase Admin
    const { admin, adminFirestore, adminMessaging } = await import('@/lib/firebase/admin');

    // Check if Firebase Admin is properly initialized
    if (!adminFirestore || !adminMessaging) {
      console.error('❌ Firebase Admin not properly initialized');
      return NextResponse.json({ 
        error: 'Notification service not available',
        details: 'Firebase Admin not initialized'
      }, { status: 500 });
    }

    // Get user's FCM tokens from Firestore
    const userDoc = await adminFirestore.collection('users').doc(recipientId).get();
    
    if (!userDoc.exists) {
      console.error('❌ User not found:', recipientId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const tokens = userData?.fcmTokens || [];

    console.log('📱 User FCM tokens:', tokens);

    if (tokens.length === 0) {
      console.log('ℹ️ No FCM tokens found for user:', recipientId);
      return NextResponse.json({ 
        success: true, 
        message: 'No FCM tokens found',
        tokens: []
      });
    }

    let payload;

    if (type === 'new_message') {
      payload = {
        title: senderName || 'New Message',
        body: messageText?.length > 100 ? messageText.substring(0, 100) + '...' : messageText || 'You have a new message',
        data: {
          chatId,
          senderId: senderId || 'unknown',
          type: 'new_message',
          click_action: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
        },
      };
    } else if (type === 'unread_count') {
      payload = {
        title: senderName || 'New Messages',
        body: `You have new unread messages`,
        data: {
          chatId,
          senderId: 'system',
          type: 'unread_count',
          click_action: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
        },
      };
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    console.log('📤 Sending notification with payload:', payload);

    const message = {
      tokens,
      notification: payload,
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
        },
        fcmOptions: {
          link: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
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

    const response = await adminMessaging.sendEachForMulticast(message);
    
    console.log('📊 Notification send result:', {
      successCount: response.successCount,
      failureCount: response.failureCount
    });

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      console.log('🔄 Cleaning up invalid tokens...');
      const cleanupPromises = response.responses.map(async (resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Failed to send to token ${tokens[idx]}:`, resp.error);
          
          if (resp.error?.code === 'messaging/registration-token-not-registered') {
            try {
              await adminFirestore.collection('users').doc(recipientId).update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(tokens[idx]),
              });
              console.log(`✅ Removed invalid token: ${tokens[idx]}`);
            } catch (cleanupError) {
              console.error('❌ Error removing invalid token:', cleanupError);
            }
          }
        }
      });
      await Promise.all(cleanupPromises);
    }

    return NextResponse.json({ 
      success: true, 
      sent: response.successCount,
      failed: response.failureCount,
      tokens: tokens.length
    });

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}