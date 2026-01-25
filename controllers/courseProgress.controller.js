import CoursePurchase from "../models/coursePurchase.model.js";
import { Course } from "../models/course.model.js";

/* =====================================================
    🎓 GET COURSE PROGRESS
===================================================== */
export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // 1. Check purchase and populate progress
    const purchase = await CoursePurchase.findOne({
      user: userId,
      course: courseId,
      paymentStatus: "success",
    }).populate("progress.completedLectures");

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message: "You are not enrolled in this course",
        isEnrolled: false,
      });
    }

    // 2. Get full course details with all lectures
    const course = await Course.findById(courseId).populate("lectures");

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(200).json({
      success: true,
      course,
      progress: purchase.progress,
      isCompleted: purchase.progress.isCompleted || false,
    });
  } catch (err) {
    console.error("Get Progress Error:", err);
    res.status(500).json({ message: "Failed to load course progress" });
  }
};

/* =====================================================
    ✅ MARK LECTURE COMPLETED (With Completion Logic)
===================================================== */
export const markLectureCompleted = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = req.user._id;

    // 1. Find the purchase record
    const purchase = await CoursePurchase.findOne({
      user: userId,
      course: courseId,
      paymentStatus: "success",
    });

    if (!purchase) {
      return res.status(403).json({ message: "Not enrolled in this course" });
    }

    // 2. Add to completed lectures if not already present
    if (!purchase.progress.completedLectures.includes(lectureId)) {
      purchase.progress.completedLectures.push(lectureId);
    }

    purchase.progress.lastWatchedLecture = lectureId;

    // 3. 🔥 CHECK IF COURSE IS FULLY COMPLETED
    const course = await Course.findById(courseId);
    const totalLecturesCount = course.lectures.length;
    const completedCount = purchase.progress.completedLectures.length;

    // Agar saare lectures dekh liye hain toh status update karo
    if (completedCount >= totalLecturesCount) {
      purchase.progress.isCompleted = true;
    }

    await purchase.save();

    res.status(200).json({
      success: true,
      message: "Lecture marked as completed",
      isCompleted: purchase.progress.isCompleted,
      completedLectures: purchase.progress.completedLectures
    });
  } catch (err) {
    console.error("Update Progress Error:", err);
    res.status(500).json({ message: "Failed to update progress" });
  }
};

/* =====================================================
    🔄 RESET COURSE PROGRESS
===================================================== */
export const resetCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const purchase = await CoursePurchase.findOne({
      user: userId,
      course: courseId,
      paymentStatus: "success",
    });

    if (!purchase) {
      return res.status(403).json({ message: "Not enrolled" });
    }

    // 🧹 Reset everything
    purchase.progress.completedLectures = [];
    purchase.progress.lastWatchedLecture = null;
    purchase.progress.isCompleted = false;

    await purchase.save();

    res.status(200).json({
      success: true,
      message: "Course progress has been reset",
    });
  } catch (err) {
    console.error("Reset Progress Error:", err);
    res.status(500).json({ message: "Failed to reset progress" });
  }
};