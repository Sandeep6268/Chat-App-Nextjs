// app/api/check-onesignal-config/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || !process.env.ONESIGNAL_REST_API_KEY) {
      return NextResponse.json({ error: 'Missing OneSignal configuration' }, { status: 400 });
    }

    // Get app details from OneSignal
    const response = await fetch(`https://api.onesignal.com/apps/${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.ONESIGNAL_REST_API_KEY}`,
      },
    });

    const appDetails = await response.json();

    if (!response.ok) {
      throw new Error(appDetails.errors?.join(', ') || 'Failed to fetch app details');
    }

    return NextResponse.json({
      success: true,
      app: {
        id: appDetails.id,
        name: appDetails.name,
        chrome_web_origin: appDetails.chrome_web_origin,
        site_name: appDetails.site_name,
        players_count: appDetails.players_count, // Registered users count
      }
    });

  } catch (error: any) {
    console.error('OneSignal config check error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}