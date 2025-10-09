// app/api/test-onesignal/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const envCheck = {
      hasAppId: !!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
      hasApiKey: !!process.env.ONESIGNAL_REST_API_KEY,
      appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ? 'Present' : 'Missing',
      apiKey: process.env.ONESIGNAL_REST_API_KEY ? 'Present' : 'Missing',
      apiKeyLength: process.env.ONESIGNAL_REST_API_KEY?.length || 0,
      apiKeyPrefix: process.env.ONESIGNAL_REST_API_KEY?.substring(0, 10) || 'None',
    };

    console.log('🔍 Environment Check:', envCheck);

    return NextResponse.json(envCheck);
  } catch (error) {
    return NextResponse.json({ error: 'Check failed' }, { status: 500 });
  }
}