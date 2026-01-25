import express from "express";
import {
  getUserProfile,
  login,
  register,
  logout,
  updateProfile,
  sendOtp,
  resetPassword,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/multer.js";

const router = express.Router();

/* ============ AUTH ============ */
router.post("/register", register);
router.post("/login", login);
router.post("/logout", isAuthenticated, logout);

/* ============ PROFILE ============ */
router.get("/profile", isAuthenticated, getUserProfile);

router.put(
  "/profile",
  isAuthenticated,
  upload.single("profilePhoto"),
  updateProfile
);

router.post("/send-otp", sendOtp);
router.post("/reset-password", resetPassword);

export default router;
