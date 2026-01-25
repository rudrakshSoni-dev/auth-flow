import  {Router} from "express"
import {validate} from "../middlewares/validate.js"
import {auth} from "../middlewares/auth.js"
import {signinLimiter} from "../middlewares/rateLimit.js"
import {
    signupSchema,
    loginSchema,
    verifyEmailSchema,
    refreshTokenSchema,
    getMeSchema,
    forgotPasswordSchema, 
    resetPasswordSchema
} from "../validators/auth.schema.js"
import { signup, signin, signout, refresh, getMe, verifyEmail, resetPassword, forgotPassword, adminStats, sendEmailOtp, verifyEmailOtp} from "../controllers/auth.controller.js"
import { requireRole } from "../middlewares/requireRole.js"

const router = Router();

router.post("/signup",validate(signupSchema),signup);
router.post("/signin", signinLimiter, validate(loginSchema), signin);
router.post("/signout", auth, signout);
router.get("/refresh", validate(refreshTokenSchema), refresh);
router.get("/me", auth, getMe);
router.get("/verify-email",verifyEmail); 
router.post("/forgot-password",forgotPassword);
router.post("/reset-password",resetPassword);
router.get("/admin/stats", auth, requireRole("admin"), adminStats);
router.post("/auth/send-otp", sendEmailOtp);
router.post("/auth/verify-otp", verifyEmailOtp);

export default router ;