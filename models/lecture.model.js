import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    lectureTitle: {
      type: String,
      required: [true, "Lecture title is required"],
      trim: true,
    },
    // Cloudinary or S3 Video URL 
    // Security Note: Consider signed URLs or private access in a real production environment
    // videoUrl: {
    //   type: String,
    //   default: "",
    // },
    // // Cloudinary asset identifier for deletion/updates
    // publicId: {
    //   type: String,
    //   default: "",
    // },
    duration: {
      type: Number, // Store in seconds for easier formatting on the frontend
      default: 0,
    },
    isPreviewFree: {
      type: Boolean,
      default: false,
    },
    // Reference to the parent Course
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    videoId: {
  type: String
 
}

  },
  { timestamps: true }
);

export const Lecture = mongoose.model("Lecture", lectureSchema);