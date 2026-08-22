import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    phoneNumber: z.string().min(10, 'Phone number must be at least 10 digits'),
    password: z.string().min(8, 'Password must be at least 8 characters long'),
    role: z.enum(['CLIENT', 'ARTISAN']),
    firstName: z.string().min(1, 'First name is required').optional(),
    lastName: z.string().min(1, 'Last name is required').optional(),
    businessName: z.string().optional(),
    state: z.string().min(1, 'State is required'),
    lgaCity: z.string().min(1, 'City/LGA is required'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().optional(),
    identifier: z.string().optional(),
    password: z.string().min(1, 'Password is required'),
  }).refine((data) => data.email || data.identifier, {
    message: 'Email or phone identifier is required',
    path: ['email'],
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

export const otpSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Email or Phone is required'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    purpose: z.enum(['PHONE_VERIFICATION', 'PASSWORD_RESET', 'WITHDRAWAL_2FA']),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Email or phone number is required'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    identifier: z.string().min(1, 'Email or phone number is required'),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
  }),
});

export const updateAvatarSchema = z.object({
  body: z.object({
    avatarUrl: z.string().url('Avatar must be a valid URL'),
  }),
});
