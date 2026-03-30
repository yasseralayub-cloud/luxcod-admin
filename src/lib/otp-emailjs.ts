/**
 * OTP Management System with EmailJS Integration
 * Handles generation, storage, validation, expiration, and email sending
 */

import { emailjs } from './firebase';

interface OTPData {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
}

const OTP_EXPIRATION_TIME = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 3;
const OTP_STORAGE_KEY = 'luxcod-otp-data';

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create OTP and store it in sessionStorage
 */
export const createOTP = (): OTPData => {
  const code = generateOTP();
  const expiresAt = Date.now() + OTP_EXPIRATION_TIME;
  const createdAt = Date.now();

  const otpData: OTPData = {
    code,
    email: 'luxcode3@gmail.com', // ثابت على بريد الأدمن
    expiresAt,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    createdAt
  };

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpData));
  }

  return otpData;
};

/**
 * Get stored OTP
 */
export const getOTPData = (): OTPData | null => {
  if (typeof window === 'undefined') return null;
  const data = sessionStorage.getItem(OTP_STORAGE_KEY);
  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

/**
 * Check OTP expiration
 */
export const isOTPExpired = (otpData: OTPData | null): boolean => {
  if (!otpData) return true;
  return Date.now() > otpData.expiresAt;
};

/**
 * Send OTP via EmailJS
 */
export const sendOTPEmail = async (otpData: OTPData): Promise<{ success: boolean; message: string }> => {
  try {
    if (!emailjs) throw new Error('EmailJS not initialized');

    const templateParams = {
      to_email: otpData.email,
      verification_code: otpData.code,
      admin_name: 'Admin'
    };

    const response = await emailjs.send(
      'service_tllf68q',
      'template_adpgkak',
      templateParams,
      'njvn9St5gAnWLOI61'
    );

    if (response.status === 200) {
      return { success: true, message: 'تم إرسال رمز التحقق إلى بريد الأدمن' };
    } else {
      throw new Error(`EmailJS returned status ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending OTP email:', error);
    const message = error instanceof Error ? error.message : 'حدث خطأ في إرسال البريد الإلكتروني';
    return { success: false, message };
  }
};

/**
 * Verify OTP code
 */
export const verifyOTP = (code: string): { valid: boolean; message: string } => {
  const otpData = getOTPData();
  if (!otpData) return { valid: false, message: 'لم يتم طلب رمز تحقق' };

  if (isOTPExpired(otpData)) {
    clearOTP();
    return { valid: false, message: 'انتهت صلاحية الرمز. يرجى طلب رمز جديد' };
  }

  if (otpData.attempts >= otpData.maxAttempts) {
    clearOTP();
    return { valid: false, message: 'تم تجاوز عدد المحاولات المسموحة. يرجى طلب رمز جديد' };
  }

  if (code.trim() !== otpData.code) {
    otpData.attempts += 1;
    if (typeof window !== 'undefined') sessionStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otpData));
    const remaining = otpData.maxAttempts - otpData.attempts;
    return { valid: false, message: `رمز غير صحيح. محاولات متبقية: ${remaining}` };
  }

  clearOTP();
  return { valid: true, message: 'تم التحقق بنجاح' };
};

/**
 * Clear OTP
 */
export const clearOTP = (): void => {
  if (typeof window !== 'undefined') sessionStorage.removeItem(OTP_STORAGE_KEY);
};
