import { z } from 'zod';

// Single source of truth for password rules — drives BOTH the server-side Zod
// schema below AND the live UI checklist (<PasswordRequirements />), so the two
// can never drift apart.
export const PASSWORD_REQUIREMENTS: { label: string; test: (value: string) => boolean }[] = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { label: 'One number', test: (v) => /[0-9]/.test(v) },
  { label: 'One special character', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

// Password validation schema — reports every unmet requirement (not just the
// first), matching the UI checklist.
export const passwordSchema = z.string().superRefine((value, ctx) => {
  for (const { label, test } of PASSWORD_REQUIREMENTS) {
    if (!test(value)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: label });
    }
  }
});

// Register schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long'),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long'),
  role: z.enum(['barber', 'client'], {
    required_error: 'Role is required',
  }),
  phone: z.string().optional(),
  agreedToTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must agree to the Terms of Service and Privacy Policy' }),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Forgot password schema
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

// Reset password schema
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Change password schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// Update user schema
export const updateUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100, 'First name is too long').optional(),
  lastName: z.string().min(1, 'Last name is required').max(100, 'Last name is too long').optional(),
  phone: z.string().max(20, 'Phone number is too long').optional(),
  avatarUrl: z.string().url('Invalid URL').optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
