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

    console.log('🔧 Firebase Admin check:', {
      hasAdmin: !!admin,
      hasFirestore: !!adminFirestore,
      hasMessaging: !!adminMessaging,
      appsLength: admin?.apps?.length || 0
    });

    // Check if Firebase Admin is properly initialized
    if (!adminFirestore || !adminMessaging) {
      console.error('❌ Firebase Admin not properly initialized');
      return NextResponse.json({ 
        error: 'Notification service not available',
        details: 'Firebase Admin services not available'
      }, { status: 500 });
    }

    // Get user's FCM tokens from Firestore
    console.log('📖 Fetching user data for:', recipientId);
    const userDoc = await adminFirestore.collection('users').doc(recipientId).get();
    
    if (!userDoc.exists) {
      console.error('❌ User not found:', recipientId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const tokens = userData?.fcmTokens || [];

    console.log('📱 User FCM tokens found:', tokens.length, 'tokens');

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
      };
    } else if (type === 'unread_count') {
      payload = {
        title: senderName || 'New Messages',
        body: `You have new unread messages`,
      };
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const messageData = {
      chatId,
      senderId: senderId || 'unknown',
      type: type || 'new_message',
      click_action: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
    };

    console.log('📤 Preparing to send notification:', {
      payload,
      data: messageData,
      tokenCount: tokens.length
    });

    // Create a simpler message format
    const message = {
      tokens,
      notification: payload,
      data: messageData,
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
    };

    console.log('🚀 Sending FCM message...');
    const response = await adminMessaging.sendEachForMulticast(message);
    
    console.log('📊 FCM Response:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses.map(r => ({
        success: r.success,
        error: r.error?.message || null
      }))
    });

    // Clean up invalid tokens
    if (response.failureCount > 0) {
      console.log('🔄 Cleaning up invalid tokens...');
      const cleanupPromises = response.responses.map(async (resp, idx) => {
        if (!resp.success) {
          console.error(`❌ Failed to send to token ${tokens[idx]}:`, resp.error);
          
          if (resp.error?.code === 'messaging/registration-token-not-registered' || 
              resp.error?.code === 'messaging/invalid-registration-token') {
            try {
              await adminFirestore.collection('users').doc(recipientId).update({
                fcmTokens: admin.firestore.FieldValue.arrayRemove(tokens[idx]),
              });
              console.log(`✅ Removed invalid token: ${tokens[idx].substring(0, 20)}...`);
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
    console.error('❌ Error in notification API:', error);
    
    // More detailed error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error instanceof Error ? error.name : 'Unknown'
    }, { status: 500 });
  }
}