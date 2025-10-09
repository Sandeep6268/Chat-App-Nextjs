import * as admin from 'firebase-admin';

// Check if Firebase Admin is already initialized
if (!admin.apps.length) {
  try {
    // Use NEW PROJECT credentials from environment
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!privateKey) {
      throw new Error('FIREBASE_PRIVATE_KEY environment variable is missing');
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID || 'chat-app-testing-234fc',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@chat-app-testing-234fc.iam.gserviceaccount.com',
        // Replace escaped newlines in the private key
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
    console.log('✅ Firebase Admin initialized with NEW TESTING PROJECT');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    // Don't throw error here to prevent build failures
  }
}

// Export the admin instance and services
export { admin };
export const adminAuth = admin.auth?.();
export const adminFirestore = admin.firestore?.();
export const adminMessaging = admin.messaging?.();