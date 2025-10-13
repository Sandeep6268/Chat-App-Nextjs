import FCMTester from './FCMTester';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FCM Mobile Tester',
  description: 'Test Firebase Cloud Messaging on mobile devices',
};

export default function FCMTestPage() {
  return <FCMTester />;
}