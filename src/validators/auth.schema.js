import { z } from "zod";

export const signupSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name too short").max(50, "Maximum 50 chars"),
    email: z.string().email(),
    password: z.string().min(8,"Min 8 chars").max(72, "Maximum 72 chars"),
  }),
});


