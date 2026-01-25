import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    courseTitle: {
      type: String,
      required: true,
      trim: true,
    },

    subTitle: {
      type: String,
      trim: true,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      required: true,
    },

    courseLevel: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    coursePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    courseThumbnail: {
      type: String,
      default: "",
    },

    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],

    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    /* ======================
       COURSE STATUS
    ====================== */
    isPublished: {
      type: Boolean,
      default: false,
    },

    // 🔥 SOFT DELETE (VERY IMPORTANT)
    isDeleted: {
      type: Boolean,
      default: false,
    },

    /* ======================
       ENROLLMENT (CACHED)
       Actual source = CoursePurchase
    ====================== */
    studentsEnrolled: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Course = mongoose.model("Course", courseSchema);
