import mongoose from "mongoose";
import { Lecture } from "../models/lecture.model.js";
import { Course } from "../models/course.model.js";
import CoursePurchase from "../models/coursePurchase.model.js";
import cloudinary from "../utils/cloudinaryCore.js"; 

// stream.controller.js ke andar

export const streamLectureVideo = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    // 🔥 FIX: req.id ki jagah req.user._id use karein
    const userId = req.user?._id; 
    
    console.log("DEBUG: UserID from req.user:", userId);

    const lecture = await Lecture.findById(lectureId);
    const course = await Course.findById(courseId);

    if (!lecture || !course) {
      return res.status(404).json({ message: "Not found" });
    }

    // Creator check mein bhi userId update karein
    const isCreator = course.creator.toString() === userId?.toString();
    
    let isPurchased = false;
    if (userId) {
      const purchase = await CoursePurchase.findOne({
        user: userId,
        course: courseId,
      paymentStatus: "success",
      });
      isPurchased = !!purchase;
    }

    if (!lecture.isPreviewFree && !isPurchased && !isCreator) {
      return res.status(403).json({ message: "Purchase required to access this lecture" });
    }

    // Cloudinary Signed URL logic (Same as your code)
    const signedUrl = cloudinary.url(lecture.publicId, {
      resource_type: "video",
      type: "authenticated",
      format: "mp4",
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 60, // 10s is too short for some slow networks, 60s safer
    });

    return res.status(200).json({
      signedUrl,
      lectureTitle: lecture.lectureTitle,
      isPreviewFree: lecture.isPreviewFree,
    });

  } catch (error) {
    console.error("Stream error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete Idea (Only by Owner)
export const deleteIdea = async (req, res) => {
    try {
        const idea = await Roadmap.findById(req.params.id);
        if (!idea) return res.status(404).json({ message: "Not found" });

        // Check if requester is the owner
        if (idea.creator.toString() !== req.id) {
            return res.status(403).json({ message: "You can only delete your own ideas" });
        }

        await Roadmap.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// Edit Idea (Only by Owner)
export const editIdea = async (req, res) => {
    try {
        const { title, tag } = req.body;
        const idea = await Roadmap.findById(req.params.id);
        
        if (idea.creator.toString() !== req.id) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        idea.title = title || idea.title;
        idea.tag = tag || idea.tag;
        await idea.save();
        
        res.status(200).json({ success: true, idea });
    } catch (error) {
        res.status(500).json({ message: "Edit failed" });
    }
};