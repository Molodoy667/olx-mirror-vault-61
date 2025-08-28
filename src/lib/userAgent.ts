// Utility functions for browser and device detection

export const getBrowserInfo = (): string => {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg') && !userAgent.includes('OPR')) {
    return 'Google Chrome';
  } else if (userAgent.includes('Firefox')) {
    return 'Mozilla Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return 'Safari';
  } else if (userAgent.includes('Edg')) {
    return 'Microsoft Edge';
  } else if (userAgent.includes('OPR')) {
    return 'Opera';
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    return 'Internet Explorer';
  } else {
    return 'Невідомий браузер';
  }
};

export const getDeviceInfo = (): string => {
  const userAgent = navigator.userAgent;
  
  if (/Android/i.test(userAgent)) {
    return 'Android';
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return 'iOS';
  } else if (/Windows/i.test(userAgent)) {
    return 'Windows';
  } else if (/Mac/i.test(userAgent)) {
    return 'macOS';
  } else if (/Linux/i.test(userAgent)) {
    return 'Linux';
  } else {
    return 'Невідома ОС';
  }
};

export const getIPAddress = async (): Promise<string> => {
  try {
    // Використовуємо безкоштовний сервіс для отримання IP
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'Невідомий IP';
  } catch (error) {
    console.error('Error getting IP address:', error);
    return 'Невідомий IP';
  }
};

export const formatUserAgent = async (): Promise<string> => {
  const browser = getBrowserInfo();
  const device = getDeviceInfo();
  const ip = await getIPAddress();
  
  return `${browser} на ${device}, IP: ${ip}`;
};