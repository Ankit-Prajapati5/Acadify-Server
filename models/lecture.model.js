import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (val) {
          return val.length === 4;
        },
        message: "Exactly 4 options required",
      },
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    // 🔥 प्रत्येक प्रश्न के लिए कैटेगरी (Tab Filtering के लिए ज़रूरी)
    level: {
      type: String,
      enum: ["easy", "medium", "hard"],
      lowercase: true, // "Hard" को "hard" बना देगा
      default: "medium",
    },
  },
  { _id: false }
);

const lectureSchema = new mongoose.Schema(
  {
    lectureTitle: {
      type: String,
      required: [true, "Lecture title is required"],
      trim: true,
    },

    duration: {
      type: Number,
      default: 0,
    },

    isPreviewFree: {
      type: Boolean,
      default: false,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    videoId: {
      type: String,
    },

    // 🔥 AI Generated Quiz Section
    quiz: {
      title: {
        type: String,
        trim: true,
      },
      // 🔥 पूरे क्विज़ की ग्लोबल कैटेगरी (पेज लोड पर सही Tab खोलने के लिए)
      difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        lowercase: true,
        default: "medium",
      },
      questions: {
        type: [questionSchema],
        default: [],
      },
    },
  },
  { timestamps: true }
);

export const Lecture = mongoose.model("Lecture", lectureSchema);