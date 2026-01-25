import express from "express";
import upload from "../utils/multer.js";
import { uploadMedia } from "../utils/cloudinary.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.post(
  "/upload-video",
  isAuthenticated,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file provided",
        });
      }

      // ✅ MEMORY BUFFER UPLOAD (NO uploads folder)
      const result = await uploadMedia(req.file.buffer, "lectures");

      return res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          url: result.secure_url,
          publicId: result.public_id,
        },
      });
    } catch (error) {
      console.error("Upload video error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload file",
      });
    }
  }
);

export default router;
