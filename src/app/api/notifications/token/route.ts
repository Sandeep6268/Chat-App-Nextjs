import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, token, action = 'save' } = await request.json();

    if (!userId || !token) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'save') {
      await adminFirestore.collection('users').doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else if (action === 'remove') {
      await adminFirestore.collection('users').doc(userId).update({
        fcmTokens: admin.firestore.FieldValue.arrayRemove(token),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error managing FCM token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}