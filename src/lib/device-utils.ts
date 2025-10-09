// lib/device-utils.ts
export class DeviceUtils {
  static isMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  static isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  static isAndroid(): boolean {
    if (typeof window === 'undefined') return false;
    return /Android/i.test(navigator.userAgent);
  }
}