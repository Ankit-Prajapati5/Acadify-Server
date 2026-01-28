import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";
import {
  uploadImage,
  deleteMediaFromCloudinary,
} from "../utils/cloudinary.js";
import { getCloudinaryPublicId } from "../utils/getCloudinaryPublicId.js";
import { Otp } from "../models/otp.model.js";
import fs from "fs";

const domains = JSON.parse(
  fs.readFileSync("./node_modules/disposable-email-domains/index.json", "utf-8")
);
import { Resend } from "resend";
const resend = new Resend(process.env.RESEND_API_KEY);

/* ================= REGISTER ================= */
export const register = async (req, res) => {
  try {
    let { name, email, password, role, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    email = email.toLowerCase().trim();

    // 🔹 OTP verify
    const otpRecord = await Otp.findOne({ email });
    if (!otpRecord || !(await bcrypt.compare(otp, otpRecord.otp))) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role === "instructor" ? "instructor" : "student",
      });

      await Otp.deleteOne({ _id: otpRecord._id });

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });

    } catch (error) {
      // 🔥 DB-level duplicate protection
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "Email already registered",
        });
      }
      throw error;
    }

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register user",
    });
  }
};


/* ================= SEND OTP ================= */

export const sendOtp = async (req, res) => {
  try {
    let email =
      typeof req.body.email === "object"
        ? req.body.email.email
        : req.body.email;

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    email = email.toLowerCase().trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    const domain = email.split("@")[1];
    if (domains.includes(domain)) {
      return res.status(400).json({
        success: false,
        message: "Disposable email addresses are not allowed",
      });
    }

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);

    await Otp.create({ email, otp: hashedOtp });

    // 🔥 RESEND EMAIL SEND
    await resend.emails.send({
      from: "onboarding@resend.dev", // free testing sender
      to: email,
      subject: "Verification Code - Acadify",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Your OTP Code</h2>
          <p>Your verification code is:</p>
          <h1 style="letter-spacing: 5px;">${rawOtp}</h1>
          <p>This code will expire in 5 minutes.</p>
        </div>
      `,
    });

console.log("Sending OTP to:", email);
    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });


  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};


/* ================= LOGIN ================= */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    generateToken(res, { userId: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: `Welcome back ${user.name}`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
      },
    });
  } catch (error) {
  console.error("LOGIN ERROR:", error);  // 👈 ADD THIS
  res.status(500).json({
    success: false,
    message: error.message || "Failed to login user"
  });
}

};

/* ================= LOGOUT ================= */
export const logout = async (req, res) => {
  try {
    return res
      .status(200)
      .cookie("token", "", { 
        httpOnly: true, 
        expires: new Date(0), 
        sameSite: "none", // 👈 "lax" की जगह "none" करें (Cross-site के लिए ज़रूरी)
        secure: true,      // 👈 Vercel/Production के लिए यह true होना ही चाहिए
        path: "/", 
      })
      .json({ success: true, message: "User logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to logout user" });
  }
};
/* ================= GET PROFILE ================= */
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").populate("enrolledCourses");
    if (!user) return res.status(404).json({ success: false, message: "Profile not found" });

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get user profile" });
  }
};

/* ================= UPDATE PROFILE (FULL FIX) ================= */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    // Humne frontend se 'oldPassword' aur 'newPassword' bheja hai
    const { name, email, oldPassword, newPassword } = req.body;

    // 1. User find karo (password select karna padega validation ke liye)
    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // 2. PASSWORD CHANGE LOGIC (Old password check ke saath)
    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ success: false, message: "Current password is required to set a new one" });
      }

      // Check karo purana password sahi hai ya nahi
      const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordMatch) {
        return res.status(401).json({ success: false, message: "Current password is incorrect" });
      }

      // Naya password hash karke save karo
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // 3. NAME & EMAIL UPDATE
    if (name) user.name = name;
    if (email) {
      // Check karo naya email kisi aur ka toh nahi hai
      const emailExist = await User.findOne({ email, _id: { $ne: userId } });
      if (emailExist) {
        return res.status(400).json({ success: false, message: "Email is already in use by another account" });
      }
      user.email = email;
    }

    // 4. PHOTO UPDATE (Cloudinary logic)
    if (req.file) {
      // Pehle purani photo delete karo
      if (user.photoUrl) {
        const publicId = getCloudinaryPublicId(user.photoUrl);
        if (publicId) {
          await deleteMediaFromCloudinary(publicId, "image");
        }
      }

      // New photo upload (Buffer based)
      const uploadRes = await uploadImage(req.file.buffer, "profile-photos");
      user.photoUrl = uploadRes.secure_url;
    }

    // Database mein save karo
    await user.save();

    // Sensitive data hata kar response bhejo
    const updatedUser = user.toObject();
    delete updatedUser.password;

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully!",
      user: updatedUser,
    });

  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile",
    });
  }
};


// 2. FORGET PASSWORD LOGIC
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    await Otp.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Reset failed" });
  }
};