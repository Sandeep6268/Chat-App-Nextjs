// app/api/env-check/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check if environment variables are available on server
    const envCheck = {
      hasAppId: !!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      hasApiKey: !!process.env.ONESIGNAL_REST_API_KEY,
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ? 'Present' : 'Missing',
      apiKey: process.env.ONESIGNAL_REST_API_KEY ? 'Present' : 'Missing',
      nodeEnv: process.env.NODE_ENV,
    };

    return NextResponse.json(envCheck);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check environment' },
      { status: 500 }
    );
  }
}