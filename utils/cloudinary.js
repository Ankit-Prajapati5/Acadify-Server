import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ================= VIDEO UPLOAD (FAST & ORIGINAL) ================= */

export const uploadMedia = (buffer, folder = "lectures") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "video",
        // 'authenticated' secure hai par bina 'eager' ke upload INSTANT hoga
        type: "authenticated",
        access_mode: "authenticated",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

/* ================= IMAGE UPLOAD ================= */

export const uploadImage = (buffer, folder = "thumbnails") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

/* ================= DELETE ================= */

export const deleteMediaFromCloudinary = async (
  publicId,
  resourceType = "video"
) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      // Authenticated videos ke liye type batana zaroori hai
      type: resourceType === "video" ? "authenticated" : "upload",
    });
  } catch (error) {
    console.error("Cloudinary Delete Error:", error);
  }
};