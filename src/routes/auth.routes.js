import  {Router} from "express"
import {validate} from "../middlewares/validate.js"
import {
    signupSchema,
} from "../validators/auth.schema.js"
import signup from "../controllers/auth.controller.js"

const router = Router();

router.post("/signup",validate(signupSchema),signup);
// router.post("/login", validate(loginSchema), authController.login);
// router.get("/verify-email",validate(verifyEmailSchema),authController.verifyEmail); 

export default router ;