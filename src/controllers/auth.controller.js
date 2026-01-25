import bcrypt from "bcrypt"
import crypto from "crypto"
import jwt from "jsonwebtoken"
import User from "../models/User.js"
import { sendEmail } from "../utils/sendMail.js"
import { hashToken } from "../utils/hashToken.js"

export const signup = async (req, res) => {
    const { name, email, password } = req.validated.body;//fetch the name ,etx from req.body
    const hashedPassword = await bcrypt.hash(password, 10);
    const exists = await User.findOne({ email }); // findOne email cuz we have selected index:true in userSchema model for signup 
    if (exists) {
        return res.status(409).json({ message: "Email already registered" });
    }
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        isEmailVerified: false,
    })
    const emailToken = jwt.sign(
        { userId: user._id },
        process.env.EMAIL_VERIFY_SECRET,
        { expiresIn: "15m" }
    );


    user.emailVerifyTokenHash = hashToken(emailToken);
    user.emailVerifyTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();


    const verifyUrl = `${process.env.FRONTEND_URL}/api/auth/verify-email?token=${emailToken}`;
    await sendEmail({
        to: user.email,
        subject: "Verify your email",
        text: `Verify your email: ${verifyUrl}`,
        html: `<p>Click here to verify:</p><a href="${verifyUrl}">Verify Email</a>`,
    });

    const { password: _, ...safeUser } = user.toObject();
    return res.status(201).json({ message: "User created successfully", user: safeUser });
}

export const signin = async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid email or password" });
    }
    if (!user.isEmailVerified) {
        return res.status(403).json({ message: "Please verify your email first" });
    }
    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES }
    );
    const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );
    const refreshTokenHashed = crypto.createHash("sha256").update(refreshToken).digest("hex");
    user.refreshTokenHash = refreshTokenHashed;
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip; // or req.headers["x-forwarded-for"]
    user.lastLoginUserAgent = req.get("user-agent") || null;
    await user.save();
    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    const { password: _, ...safeUser } = user.toObject();
    return res.status(200).json({ message: "Signin successful", accessToken, user: safeUser });
}

export const signout = async (req, res) => {
    // revoke refresh token in DB
    await User.findByIdAndUpdate(req.user.userId, { refreshTokenHash: null });


    // clear cookie
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });


    return res.status(200).json({ message: "Signout successful" });
};
export const refresh = async (req, res) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token not found" });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user || !user.refreshTokenHash) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const incomingHash = crypto
            .createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        if (incomingHash !== user.refreshTokenHash) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const accessToken = jwt.sign(
            { userId: decoded.userId },
            process.env.JWT_ACCESS_SECRET,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES }
        );

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // true on HTTPS
            sameSite: "lax", // better default than strict
            path: "/auth/refresh", // cookie only sent to this route
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({ accessToken });
    } catch (error) {
        return res.status(401).json({ message: "Invalid refresh token" });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });


        return res.json({ user });
    } catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
}

export const verifyEmail = async (req, res) => {
    const { token } = req.query; // /verify-email?token=...


    if (!token) return res.status(400).json({ message: "Token missing" });


    try {
        // 1) verify JWT signature + expiry
        const decoded = jwt.verify(token, process.env.EMAIL_VERIFY_SECRET);


        // 2) lookup user and compare hashed token
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(400).json({ message: "Invalid token" });


        if (user.isEmailVerified) {
            return res.status(200).json({ message: "Email already verified" });
        }


        if (!user.emailVerifyTokenHash || !user.emailVerifyTokenExpiresAt) {
            return res.status(400).json({ message: "No verification token found" });
        }


        if (user.emailVerifyTokenExpiresAt < new Date()) {
            return res.status(400).json({ message: "Token expired" });
        }


        const incomingHash = hashToken(token);
        if (incomingHash !== user.emailVerifyTokenHash) {
            return res.status(400).json({ message: "Invalid token" });
        }


        // 3) mark verified + clear token
        user.isEmailVerified = true;
        user.emailVerifyTokenHash = undefined;
        user.emailVerifyTokenExpiresAt = undefined;
        await user.save();
        return res.status(200).json({ message: "Email verified successfully" });
    } catch (err) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }
};

export const forgotPassword = async (req, res) => {

    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required" });

    const genericMsg = "If an account exists, a reset link has been sent.";

    const user = await User.findOne({ email });

    const jti = crypto.randomBytes(16).toString("hex");

    if (!user) return res.status(200).json({ message: genericMsg });

    const resetToken = jwt.sign(
        { userId: user._id, jti: jti },
        process.env.RESET_PASSWORD_SECRET,
        { expiresIn: "15m" }
    );

    user.passwordResetTokenHash = hashToken(resetToken);

    user.passwordResetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

    await sendEmail({
        to: user.email,
        subject: "Reset your password",
        text: `Reset your password: ${resetUrl}`,
        html: `<p>You requested a password reset. Copy the password reset token.</p>
               <p>This token is valid for 15 minutes:</p>
               <p><a href="${resetUrl}">Reset Password</a></p>
               <p>If you didn’t request this, ignore this email.</p>
               <p>This is the reset token</p>
               <h3>${resetToken}</h3>`,
    });

    return res.status(200).json({ message: genericMsg });
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
    if (!token) return res.status(400).json({ message: "Token missing" });

    try {
        const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user) return res.status(400).json({ message: "User not found" });

        if (!user.passwordResetTokenHash || !user.passwordResetTokenExpiresAt) {
            return res.status(400).json({ message: "Reset token not stored on user" });
        }

        if (user.passwordResetTokenExpiresAt < new Date()) {
            return res.status(400).json({ message: "Token expired (db expiry)" });
        }

        if (hashToken(token) !== user.passwordResetTokenHash) {
            return res.status(400).json({ message: "Token hash mismatch" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetTokenHash = null;
        user.passwordResetTokenExpiresAt = null;
        user.refreshTokenHash = null;
        await user.save();

        return res.status(200).json({ message: "Password reset successful" });
    } catch (err) {
        console.log("Server now:", new Date().toISOString());
        console.log("Token payload:", jwt.decode(token));

        console.log("JWT verify error:", err.message);
        return res.status(400).json({ message: `JWT error: ${err.message}` });
    }
};

export const adminStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        // Add more stats as needed
        return res.status(200).json({ userCount });
    } catch (err) {
        return res.status(500).json({ message: "Server error" });
    }
};

export const sendEmailOtp = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(200).json({ message: "If account exists, OTP sent." });

  if (user.isEmailVerified) {
    return res.status(400).json({ message: "Email already verified" });
  }

  // Optional: throttle resends
  if (user.emailOtpResendAfter && user.emailOtpResendAfter > new Date()) {
    return res.status(429).json({ message: "Please wait before requesting again" });
  }

  const otp = generateOtp();
  user.emailOtpHash = hashOtp(otp);
  user.emailOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  user.emailOtpAttempts = 0;
  user.emailOtpResendAfter = new Date(Date.now() + 60 * 1000); // 60s cooldown

  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Your verification OTP",
    text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`,
  });

  return res.json({ message: "OTP sent" });
};

export const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "Invalid OTP" });

  if (user.isEmailVerified) {
    return res.status(200).json({ message: "Already verified" });
  }

  if (!user.emailOtpHash || !user.emailOtpExpiresAt) {
    return res.status(400).json({ message: "OTP not requested" });
  }

  if (user.emailOtpExpiresAt < new Date()) {
    return res.status(400).json({ message: "OTP expired" });
  }

  // Limit attempts (optional but recommended)
  user.emailOtpAttempts += 1;
  if (user.emailOtpAttempts > 5) {
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    await user.save();
    return res.status(429).json({ message: "Too many attempts. Request a new OTP." });
  }

  const isValid = hashOtp(String(otp).trim()) === user.emailOtpHash;
  if (!isValid) {
    await user.save();
    return res.status(400).json({ message: "Invalid OTP" });
  }

  // Success
  user.isEmailVerified = true;
  user.emailOtpHash = null;
  user.emailOtpExpiresAt = null;
  user.emailOtpAttempts = 0;
  user.emailOtpResendAfter = null;

  await user.save();

  return res.json({ message: "Email verified successfully" });
};
