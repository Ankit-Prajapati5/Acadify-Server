import Razorpay from "razorpay";
import crypto from "crypto";
import { Course } from "../models/course.model.js";
import CoursePurchase from "../models/coursePurchase.model.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_SECRET_KEY,
});

/* =====================================================
   CREATE COURSE ORDER
===================================================== */
export const createCourseOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      return res.status(404).json({
        success: false,
        message: "Course not available",
      });
    }

    // Instructor cannot buy own course
    if (course.creator.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Instructor cannot purchase own course",
      });
    }

    // Already purchased check
    const alreadyPurchased = await CoursePurchase.findOne({
      user: userId,
      course: courseId,
      paymentStatus: "success",
      isCourseDeleted: false,
    });

    if (alreadyPurchased) {
      return res.status(400).json({
        success: false,
        message: "Course already purchased",
      });
    }

    const order = await razorpay.orders.create({
      amount: course.coursePrice * 100,
      currency: "INR",
      receipt: `c_${course._id.toString().slice(-6)}_${Date.now()
        .toString()
        .slice(-6)}`
    });

    const purchase = await CoursePurchase.findOneAndUpdate(
      { user: userId, course: courseId },
      {
        amount: course.coursePrice,
        razorpayOrderId: order.id,
        paymentStatus: "created",
        isCourseDeleted: false,
      },
      { upsert: true, new: true }
    );

    res.status(201).json({
      success: true,
      order,
      purchaseId: purchase._id,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Order creation failed",
    });
  }
};

/* =====================================================
   RAZORPAY WEBHOOK
===================================================== */
export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const signature = req.headers["x-razorpay-signature"];

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(req.body) // RAW BUFFER
      .digest("hex");

    if (expectedSignature !== signature) {
      return res.status(400).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString());

    if (event.event !== "payment.captured") {
      return res.json({ received: true });
    }

    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;

    const purchase = await CoursePurchase.findOne({
      razorpayOrderId: orderId,
    });

    if (!purchase) {
      return res.json({ received: true });
    }

    // Idempotent protection
    if (purchase.paymentStatus !== "success") {
      purchase.paymentStatus = "success";
      purchase.razorpayPaymentId = payment.id;
      purchase.razorpaySignature = signature;
      purchase.paidAt = new Date();
      await purchase.save();

      await Course.findByIdAndUpdate(purchase.course, {
        $inc: { studentsEnrolled: 1 },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(500).json({ message: "Webhook failed" });
  }
};

/* =====================================================
   CHECK PURCHASE
===================================================== */
export const checkCoursePurchase = async (req, res) => {
  try {
    const purchase = await CoursePurchase.findOne({
      user: req.user._id,
      course: req.params.courseId,
      paymentStatus: "success",
      isCourseDeleted: false,
    });

    res.status(200).json({
      success: true,
      isPurchased: Boolean(purchase),
      purchasedAt: purchase?.paidAt || null,
    });
  } catch {
    res.status(500).json({ success: false });
  }
};

/* =====================================================
   MY LEARNING
===================================================== */
export const getMyLearningCourses = async (req, res) => {
  try {
    const purchases = await CoursePurchase.find({
      user: req.user._id,
      paymentStatus: "success",
      isCourseDeleted: false,
    }).populate({
      path: "course",
      match: { isPublished: true },
      populate: {
        path: "creator",
        select: "name photoUrl",
      },
    });

    const courses = purchases
      .filter((p) => p.course)
      .map((p) => p.course);

    res.status(200).json({
      success: true,
      courses,
    });
  } catch (error) {
    console.error("My learning error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch enrolled courses",
    });
  }
};
