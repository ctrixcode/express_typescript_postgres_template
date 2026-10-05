import { z } from 'zod';

export const RegisterBodySchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .optional(),
});
export type RegisterInput = z.infer<typeof RegisterBodySchema>;

export const LoginBodySchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof LoginBodySchema>;

export const RefreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
export type RefreshTokenInput = z.infer<typeof RefreshTokenBodySchema>;

// Route wrapper schemas for validate middleware
export const RegisterRouteSchema = z.object({
  body: RegisterBodySchema,
});

export const LoginRouteSchema = z.object({
  body: LoginBodySchema,
});

export const RefreshTokenRouteSchema = z.object({
  body: RefreshTokenBodySchema,
});
