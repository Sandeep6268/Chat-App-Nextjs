import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'API is working',
    environment: process.env.NODE_ENV,
    hasFirebaseConfig: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
    timestamp: new Date().toISOString()
  });
}
