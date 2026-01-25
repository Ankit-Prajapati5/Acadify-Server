import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import optionalAuth from "../middlewares/optionalAuth.js";
import upload from "../utils/multer.js";

import {
  // course
  createCourse,
  getCreatorCourses,
   getCreatorCourseById, // ✅ ADD THIS
  editCourse,
  uploadCourseThumbnail,
  deleteCourse,
  getPublishedCourse,
  getCourseById,

  // lecture
  createLecture,
  getCourseLecture,
  getLectureById,
  editLecture,
  removeLecture,
  getCourseDetailWithLessons,
  togglePublishCourse,
} from "../controllers/course.controller.js";



const router = express.Router();

/* =====================================================
   👨‍🏫 INSTRUCTOR ROUTES
===================================================== */

// CREATE COURSE
router.post("/", isAuthenticated, createCourse);

// GET OWN COURSES
router.get("/creator", isAuthenticated, getCreatorCourses);

// 🔥 GET SINGLE CREATOR COURSE
router.get("/creator/:id", isAuthenticated, getCreatorCourseById);

// EDIT COURSE (TEXT ONLY)
router.put(
  "/:id",
  isAuthenticated,
  upload.none(),   // 🔥 THIS LINE
  editCourse
);


// 🔥 UPLOAD / UPDATE COURSE THUMBNAIL (IMAGE ONLY)
router.put(
  "/:id/thumbnail",
  isAuthenticated,
  upload.single("courseThumbnail"),
  uploadCourseThumbnail
);

// PUBLISH / UNPUBLISH

router.patch(
  "/:id/toggle-publish",
  isAuthenticated,   // 🎓 only instructor can do this
  togglePublishCourse
);

// DELETE COURSE
router.delete("/:id", isAuthenticated, deleteCourse);


/* =====================================================
   👨‍🏫 LECTURE ROUTES
===================================================== */

// CREATE LECTURE
router.post("/:id/lecture", isAuthenticated, createLecture);

// GET ALL LECTURES
router.get("/:id/lecture", isAuthenticated, getCourseLecture);

// GET SINGLE LECTURE
router.get("/:id/lecture/:lectureId", isAuthenticated, getLectureById);

// EDIT LECTURE (video / free toggle)
router.put(
  "/:id/lecture/:lectureId",
  isAuthenticated,
  upload.single("video"), // 🔥 video file yahin aayegi
  editLecture
);


// DELETE LECTURE
router.delete("/:id/lecture/:lectureId", isAuthenticated, removeLecture);



/* =====================================================
   👨‍🎓 PUBLIC ROUTES
===================================================== */

router.get("/published", getPublishedCourse);
router.route("/:courseId").get(isAuthenticated, getCourseDetailWithLessons);
router.get("/public/:id", optionalAuth, getCourseById);

export default router;
