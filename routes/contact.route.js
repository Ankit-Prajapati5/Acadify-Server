import express from "express";
import { sendContactEmail } from "../controllers/contact.controller.js";

const router = express.Router();

// Route: POST /api/v1/contact
router.route("/").post(sendContactEmail);

export default router;