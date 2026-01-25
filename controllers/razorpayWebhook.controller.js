import crypto from "crypto";
import CoursePurchase from "../models/coursePurchase.model.js";
import { Course } from "../models/course.model.js";
import { User } from "../models/user.model.js"; // 🔥 IMPORTANT

export const razorpayWebhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    // 🔐 Verify Razorpay signature
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

    const purchase = await CoursePurchase.findOne({
      razorpayOrderId: payment.order_id,
    });

    if (!purchase) {
      return res.json({ received: true });
    }

    // 🔁 Idempotent check
    if (purchase.paymentStatus === "success") {
      return res.json({ received: true });
    }

    // ✅ Mark success
    purchase.paymentStatus = "success";
    purchase.razorpayPaymentId = payment.id;
    purchase.razorpaySignature = signature;
    purchase.paidAt = new Date();
    await purchase.save();

    // 🔥 Increment enrolled students count
    await Course.findByIdAndUpdate(purchase.course, {
      $inc: { studentsEnrolled: 1 },
    });

    // 🔥 Add course to user's enrolledCourses (no duplicate)
    await User.findByIdAndUpdate(purchase.user, {
      $addToSet: { enrolledCourses: purchase.course },
    });

    return res.json({ success: true });

  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Webhook error" });
  }
};
