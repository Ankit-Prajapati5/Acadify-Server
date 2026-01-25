import express from "express";
import protect  from "../middlewares/isAuthenticated.js";
import {
  createCourseOrder,
  checkCoursePurchase,
  getMyLearningCourses,
} from "../controllers/coursePurchase.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.post("/create-order", protect, createCourseOrder);

router.get("/status/:courseId", protect, checkCoursePurchase); // 🔥 FIX
router.get("/my-learning", isAuthenticated, getMyLearningCourses);
export default router;
