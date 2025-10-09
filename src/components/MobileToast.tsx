// components/MobileToast.tsx
'use client';

import { useEffect } from 'react';

interface MobileToastProps {
  senderName: string;
  message: string;
  chatId: string;
  onTap: () => void;
}

export function MobileToast({ senderName, message, chatId, onTap }: MobileToastProps) {
  useEffect(() => {
    const handleClick = () => {
      onTap();
    };

    // Add click event to parent element
    const toastElement = document.querySelector('[data-toast-wrapper]');
    if (toastElement) {
      toastElement.addEventListener('click', handleClick);
      return () => toastElement.removeEventListener('click', handleClick);
    }
  }, [onTap]);

  const truncatedMessage = message.length > 40 ? message.substring(0, 40) + '...' : message;

  return (
    <div 
      className="mobile-toast"
      style={{
        cursor: 'pointer',
        padding: '12px 16px',
        background: 'white',
        border: '2px solid #3B82F6',
        borderRadius: '12px',
        minWidth: '300px',
        maxWidth: '90vw',
      }}
      onClick={() => {
        window.location.href = `/chat/${chatId}`;
      }}
    >
      <div style={{ fontWeight: '600', color: '#111827', marginBottom: '4px', fontSize: '16px' }}>
        💬 {senderName}
      </div>
      <div style={{ color: '#374151', fontSize: '14px', marginBottom: '4px' }}>
        {truncatedMessage}
      </div>
      <div style={{ color: '#2563EB', fontSize: '12px', fontWeight: '500' }}>
        Tap to open chat
      </div>
    </div>
  );
}