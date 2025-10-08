// lib/config.ts
export const getAppConfig = () => {
  // For production - use your actual Vercel URL
  const productionUrl = 'https://chat-app-nextjs-gray-eta.vercel.app';
  
  // For development
  const developmentUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://chat-app-nextjs-gray-eta.vercel.app';
  
  const isProduction = process.env.NODE_ENV === 'production';
  const baseUrl = isProduction ? productionUrl : developmentUrl;
  
  return {
    baseUrl,
    isProduction,
    isDevelopment: !isProduction
  };
};

export const APP_CONFIG = getAppConfig();