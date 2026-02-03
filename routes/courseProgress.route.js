import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  getCourseProgress,
  markLectureCompleted,
  resetCourseProgress,
} from "../controllers/courseProgress.controller.js";

const router = express.Router();

router.get("/:courseId", isAuthenticated, getCourseProgress);
router.post(
  "/:courseId/lecture/:lectureId",
  isAuthenticated,
  markLectureCompleted
);
router.post(
  "/:courseId/reset",
  isAuthenticated,
  resetCourseProgress
);

export default router;