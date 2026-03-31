/**
 * OTP Management System
 * Handles generation, storage, validation, and expiration of One-Time Passwords
 */

import { emailjs } from './firebase';

interface OTPData {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

const OTP_EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutes in milliseconds
const MAX_ATTEMPTS = 3;
const OTP_STORAGE_KEY = 'luxcod-otp-data';

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create and store OTP data with expiration
 */
export const createOTP = (email: string): OTPData => {
  const code = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME;
  
  const otpData: OTPData = {
    code,
    email,
    expiresAt,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS
  };
  
  // Store in sessionStorage (cleared when browser closes)
  sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpData));
  
  return otpData;
};

/**
 * Get stored OTP data
 */
export const getOTPData = (): OTPData | null => {
  const data = sessionStorage.getItem(OTP_STORAGE_KEY);
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Check if OTP is expired
 */
export const isOTPExpired = (otpData: OTPData | null): boolean => {
  if (!otpData) return true;
  return Date.now() > otpData.expiresAt;
};

/**
 * Get remaining time in milliseconds
 */
export const getOTPRemainingTime = (otpData: OTPData | null): number => {
  if (!otpData) return 0;
  const remaining = otpData.expiresAt - Date.now();
  return remaining > 0 ? remaining : 0;
};

/**
 * Format remaining time as MM:SS
 */
export const formatOTPTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Send OTP via EmailJS
 */
export const sendOTPEmail = async (email: string, otp: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (!emailjs) {
      throw new Error('EmailJS not initialized');
    }

    // Fixed variables according to user requirements
    const templateParams = {
      to_email: "luxcode3@gmail.com",
      verification_code: String(otp),
      admin_name: "Admin"
    };

    const response = await emailjs.send(
      "service_tllf68q",
      "template_adpgkak",
      templateParams,
      "njvn9St5gAnWLOI61"
    );

    if (response.status === 200) {
      return {
        success: true,
        message: 'تم إرسال رمز التحقق إلى بريد الأدمن'
      };
    } else {
      throw new Error(`EmailJS returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return {
      success: false,
      message: 'حدث خطأ في إرسال البريد الإلكتروني'
    };
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = (code: string): { valid: boolean; message: string } => {
  const otpData = getOTPData();
  
  if (!otpData) {
    return { valid: false, message: 'لم يتم طلب رمز تحقق' };
  }
  
  if (isOTPExpired(otpData)) {
    clearOTP();
    return { valid: false, message: 'انتهت صلاحية الرمز. يرجى طلب رمز جديد' };
  }
  
  if (otpData.attempts >= otpData.maxAttempts) {
    clearOTP();
    return { valid: false, message: 'تم تجاوز عدد المحاولات المسموحة' };
  }
  
  if (code !== otpData.code) {
    // Increment attempts
    otpData.attempts += 1;
    sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpData));
    
    const remainingAttempts = otpData.maxAttempts - otpData.attempts;
    return {
      valid: false,
      message: `رمز غير صحيح. محاولات متبقية: ${remainingAttempts}`
    };
  }
  
  // OTP is valid
  clearOTP();
  return { valid: true, message: 'تم التحقق بنجاح' };
};

/**
 * Clear OTP data
 */
export const clearOTP = (): void => {
  sessionStorage.removeItem(OTP_STORAGE_KEY);
};

/**
 * Get OTP status information
 */
export const getOTPStatus = () => {
  const otpData = getOTPData();
  
  if (!otpData) {
    return {
      exists: false,
      expired: true,
      remainingTime: 0,
      remainingAttempts: 0,
      formattedTime: '00:00'
    };
  }
  
  const expired = isOTPExpired(otpData);
  const remainingTime = getOTPRemainingTime(otpData);
  const remainingAttempts = otpData.maxAttempts - otpData.attempts;
  
  return {
    exists: true,
    expired,
    remainingTime,
    remainingAttempts,
    formattedTime: formatOTPTime(remainingTime),
    email: otpData.email
  };
};
