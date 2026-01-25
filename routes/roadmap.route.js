import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { deleteIdea, editIdea, getAllIdeas, suggestIdea, toggleUpvote } from "../controllers/roadmap.controller.js";

const router = express.Router();

router.route("/").get(getAllIdeas);
router.route("/suggest").post(isAuthenticated, suggestIdea);
router.route("/upvote/:ideaId").put(isAuthenticated, toggleUpvote);
router.route("/edit/:ideaId").put(isAuthenticated, editIdea);
router.route("/delete/:ideaId").delete(isAuthenticated, deleteIdea);

export default router;