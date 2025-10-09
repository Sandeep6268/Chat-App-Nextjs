import { NextRequest, NextResponse } from 'next/server';
// Add this function before the POST function
async function getUserDisplayName(userId: string): Promise<string> {
  try {
    const { adminFirestore } = await import('@/lib/firebase/admin');
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      return userData?.displayName || userData?.email?.split('@')[0] || 'User';
    }
    return 'User';
  } catch (error) {
    console.error('Error getting user display name:', error);
    return 'User';
  }
}

// Then in the POST function, update the payload creation:
export async function POST(request: NextRequest) {
  try {
    const { recipientId, senderName, messageText, chatId, senderId, type } = await request.json();

    console.log('📨 Received notification request:', {
      recipientId,
      senderName,
      messageText: messageText?.substring(0, 50),
      chatId,
      senderId,
      type
    });

    if (!recipientId || !chatId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Dynamically import Firebase Admin
    const { admin, adminFirestore, adminMessaging } = await import('@/lib/firebase/admin');

    // Get sender's actual display name
    const actualSenderName = await getUserDisplayName(senderId);

    // Get user's FCM tokens from Firestore
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
        title: actualSenderName || 'New Message', // Use actual name
        body: messageText?.length > 100 ? messageText.substring(0, 100) + '...' : messageText || 'You have a new message',
      };
    } else if (type === 'unread_count') {
      payload = {
        title: `${actualSenderName}`, // Use actual name
        body: `You have new unread messages`,
      };
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    const messageData = {
      chatId: chatId,
      senderId: senderId || 'unknown',
      type: type || 'new_message',
      click_action: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`, // Fixed: specific chat URL
    };

    console.log('📤 Sending notification with:', {
      title: payload.title,
      body: payload.body,
      chatId: chatId,
      redirectUrl: messageData.click_action
    });

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
          // Add actions for better mobile support
          actions: [
            {
              action: 'open',
              title: 'Open Chat'
            },
            {
              action: 'dismiss', 
              title: 'Dismiss'
            }
          ]
        },
        fcmOptions: {
          link: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`, // Fixed link
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            // iOS specific settings
            'mutable-content': 1
          },
        },
      },
      android: {
        notification: {
          sound: 'default',
          channel_id: 'fcm_default_channel',
          click_action: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`
        }
      }
    };

    console.log('🚀 Sending FCM message...');
    const response = await adminMessaging.sendEachForMulticast(message);
    
    console.log('📊 FCM Response:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
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
      tokens: tokens.length,
      notification: {
        title: payload.title,
        body: payload.body,
        chatId: chatId
      }
    });

  } catch (error) {
    console.error('❌ Error in notification API:', error);
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}