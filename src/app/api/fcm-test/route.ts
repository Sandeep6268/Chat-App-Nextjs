import { NextResponse } from "next/server";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req: Request) {
  const { token, title, body } = await req.json();
  try {
    const message = { token, notification: { title, body } };
    const response = await admin.messaging().send(message);
    return NextResponse.json({ success: true, response });
  } catch (err) {
    return NextResponse.json({ success: false, error: String(err) });
  }
}
