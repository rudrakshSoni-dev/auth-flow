// middlewares/rateLimit.js
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const signinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = (req.body?.email || "").toLowerCase().trim();
    return `${ipKeyGenerator(req)}:${email}`;
  },
  message: { message: "Too many login attempts. Try again later." },
});
