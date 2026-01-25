import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },

    email: { type: String, required: true, trim: true, lowercase: true, index: true, unique: true },

    password: { type: String, required: true, trim: true },

    role: { type: String, enum: ["user", "admin"], default: "user" },

    refreshTokenHash: { type: String, default: null },

    isEmailVerified: { type: Boolean, default: false },

    emailVerifyTokenHash: { type: String, default: null },

    emailVerifyTokenExpiresAt: { type: Date, default: null },

    passwordResetTokenHash: { type: String, default: null },

    passwordResetTokenExpiresAt: { type: Date, default: null },

    lastLoginAt: { type: Date, default: null },

    lastLoginIp: { type: String, default: null },

    lastLoginUserAgent: { type: String, default: null },

    emailOtpHash: { type: String, default: null },
    emailOtpExpiresAt: { type: Date, default: null },
    emailOtpAttempts: { type: Number, default: 0 },
    emailOtpResendAfter: { type: Date, default: null }, // optional throttle


}, { timestamps: true });

// userSchema.set("toJSON", {
//     transform:(doc, ret) => {
//         delete ret.passwordHash;
//         delete ret.emailVerifyTokenExpiresAt;
//         delete ret.emailVerifyTokenHash;
//         delete ret.passwordResetTokenExpiresAt;
//         delete ret.passwordResetTokenHash;
//         return ret;
//         delete ret.__v;
//     }
// })

export default mongoose.model("User", userSchema);