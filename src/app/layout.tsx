// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/auth/AuthProvider';
import { Toaster } from 'react-hot-toast';
import NotificationProvider from '@/components/providers/NotificationProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chat App',
  description: 'A real-time chat application built with Next.js and Firebase',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        
        {/* ✅ Add meta tags for PWA */}
        <meta name="theme-color" content="#10B981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Chat App" />
        
        
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <NotificationProvider>

          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontSize: '14px',
              },
              success: {
                duration: 4000,
                style: {
                  background: '#10B981',
                  color: '#fff',
                },
                iconTheme: {
                  primary: '#fff',
                  secondary: '#10B981',
                },
              },
            }}
            />
            </NotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}