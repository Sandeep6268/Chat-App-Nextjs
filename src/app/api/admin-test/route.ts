import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { admin, adminFirestore } = await import('@/lib/firebase/admin');
    
    return NextResponse.json({
      success: true,
      adminInitialized: !!admin.apps.length,
      firestoreAvailable: !!adminFirestore,
      projectId: process.env.FIREBASE_PROJECT_ID ? 'Set' : 'Missing',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? 'Set' : 'Missing',
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? 'Set' : 'Missing',
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}