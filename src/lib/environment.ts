// // lib/environment.ts
// export const isProduction = () => {
//   return process.env.NODE_ENV === 'production';
// };

// export const isVercel = () => {
//   return process.env.VERCEL === '1';
// };

// export const canUseNotifications = () => {
//   if (typeof window === 'undefined') return false;
  
//   const isLocalhost = window.location.hostname === 'localhost';
//   const isHttps = window.location.protocol === 'https:';
  
//   // Notifications work on localhost and HTTPS sites
//   return isLocalhost || isHttps;
// };