import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import optionalAuth from "../middlewares/optionalAuth.js";
import { streamLectureVideo } from "../controllers/stream.controller.js";

const router = express.Router();

// auth optional (preview allowed)
router.get("/:courseId/lecture/:lectureId/stream",isAuthenticated, streamLectureVideo);

export default router;
