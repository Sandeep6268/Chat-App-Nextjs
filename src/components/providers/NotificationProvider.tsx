'use client';

import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNotifications } from '@/hooks/useNotifications';

interface NotificationContextType {
  fcmToken: string | null;
  permission: NotificationPermission;
  hasPermission: boolean;
  initializeNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const notification = useNotifications();

  // Auto-initialize notifications when user logs in
  useEffect(() => {
    if (user && notification.permission === 'default') {
      notification.initializeNotifications();
    }
  }, [user, notification]);

  return (
    <NotificationContext.Provider value={notification}>
      {children}
    </NotificationContext.Provider>
  );
}