import mongoose from "mongoose";

const coursePurchaseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    razorpayOrderId: {
      type: String,
      required: true,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      default: null,
    },

    razorpaySignature: {
      type: String,
      default: null,
    },

    paymentStatus: {
      type: String,
      enum: ["created", "success", "failed", "refunded"],
      default: "created",
      index: true,
    },

    paidAt: {
      type: Date,
      default: null,
    },
  
    /* ======================
       SAFETY FLAGS
    ====================== */

    // 🔥 if course is deleted later
    isCourseDeleted: {
      type: Boolean,
      default: false,
    },
   // 🔥 COURSE PROGRESS (MAIN)
    progress: {
      completedLectures: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lecture",
        },
      ],
      lastWatchedLecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
        default: null,
      },
    },
  },
  { timestamps: true }
);

/* =====================================================
   🔐 UNIQUE PURCHASE RULE (SAFE VERSION)
   one user → one course → only if SUCCESS
===================================================== */
coursePurchaseSchema.index(
  { user: 1, course: 1, paymentStatus: 1 },
  {
    unique: true,
    partialFilterExpression: {
      paymentStatus: "success",
    },
  }
);

const CoursePurchase = mongoose.model(
  "CoursePurchase",
  coursePurchaseSchema
);

export default CoursePurchase;
