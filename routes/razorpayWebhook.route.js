import express from "express";
import { razorpayWebhook } from "../controllers/razorpayWebhook.controller.js";

const router = express.Router();

router.post("/", razorpayWebhook);

export default router;
