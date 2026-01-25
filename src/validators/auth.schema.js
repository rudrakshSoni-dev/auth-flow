import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name too short").max(50, "Maximum 50 chars"),
    email: z.string().email(),
    password: z.string().min(8, "Min 8 chars").max(72, "Maximum 72 chars"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8, "Min 8 chars").max(72, "Maximum 72 chars"),
  }),
});
export const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});
export const getMeSchema = z.object({
  headers: z.object({
    authorization: z.string().min(1, "Authorization header is required"),
  }),
});
export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1, "Token is required"),
  }),
});
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(2000),
  newPassword: z.string().min(8).max(100),
});


