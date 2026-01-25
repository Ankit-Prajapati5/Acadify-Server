// routes/purchase.route.js
import express from "express";
import { getDashboardStats } from "../controllers/purchase.controller.js";
import  isAuthenticated  from "../middlewares/isAuthenticated.js";

const router = express.Router();

// Admin stats ke liye route
router.get("/purchase/stats",isAuthenticated, getDashboardStats);

export default router;