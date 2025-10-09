import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { recipientId, senderName, messageText, chatId, senderId, type } = await request.json();

    console.log('📨 Notification request:', { recipientId, senderId, chatId });

    if (!recipientId || !chatId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Dynamically import Firebase Admin
    const { adminFirestore, adminMessaging } = await import('@/lib/firebase/admin');

    // Get user's FCM tokens - SIMPLE APPROACH
    const userDoc = await adminFirestore.collection('users').doc(recipientId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const tokens = userData?.fcmTokens || [];

    console.log('📱 FCM tokens:', tokens.length);

    if (tokens.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No FCM tokens found'
      });
    }

    // Get sender info for notification
    const senderDoc = await adminFirestore.collection('users').doc(senderId).get();
    const senderData = senderDoc.data();
    const actualSenderName = senderData?.displayName || senderData?.email?.split('@')[0] || 'Someone';

    // SIMPLE NOTIFICATION PAYLOAD
    const notificationPayload = {
      title: `${actualSenderName}`, // ACTUAL NAME
      body: messageText?.length > 50 ? messageText.substring(0, 50) + '...' : messageText || 'Sent you a message',
    };

    // DATA PAYLOAD for service worker
    const dataPayload = {
      title: `${actualSenderName}`,
      body: messageText?.length > 50 ? messageText.substring(0, 50) + '...' : messageText,
      chatId: chatId,
      senderId: senderId,
      type: 'new_message',
      click_action: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`
    };

    console.log('📤 Sending notification:', {
      title: notificationPayload.title,
      chatId: chatId
    });

    // SIMPLE MESSAGE
    const message = {
      tokens: tokens,
      notification: notificationPayload,
      data: dataPayload, // This goes to service worker
      webpush: {
        fcmOptions: {
          link: `https://chat-app-nextjs-gray-eta.vercel.app/chat/${chatId}`,
        },
      },
    };

    // SEND NOTIFICATION
    const response = await adminMessaging.sendEachForMulticast(message);
    
    console.log('✅ Notification sent:', {
      success: response.successCount,
      failed: response.failureCount
    });

    return NextResponse.json({ 
      success: true, 
      sent: response.successCount,
      failed: response.failureCount,
      notification: {
        title: notificationPayload.title,
        chatId: chatId
      }
    });

  } catch (error) {
    console.error('❌ Notification error:', error);
    return NextResponse.json({ 
      error: 'Failed to send notification'
    }, { status: 500 });
  }
}