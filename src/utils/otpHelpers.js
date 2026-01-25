import crypto from "crypto";

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000)); // 6 digits

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");
