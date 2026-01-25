import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./database/db.js";

// Routes
import userRoute from "./routes/user.route.js";
import courseRoute from "./routes/course.route.js";
import mediaRoute from "./routes/media.route.js";
import coursePurchaseRoute from "./routes/coursePurchase.route.js";
import streamRoute from "./routes/stream.route.js";
import razorpayWebhookRoute from "./routes/razorpayWebhook.route.js";
import courseProgressRoute from "./routes/courseProgress.route.js";
import purchaseRoute from "./routes/purchase.route.js";
import contactRoute from "./routes/contact.route.js";
import roadmapRoute from "./routes/roadmap.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/**
 * 🔥 Razorpay Webhook
 * ⚠️ MUST come before express.json()
 */
app.use(
  "/api/v1/webhook/razorpay",
  express.raw({ type: "application/json" }),
  razorpayWebhookRoute
);

/**
 * 🌐 Global Middlewares
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: [process.env.CLIENT_URL,process.env.NETLIFY_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);


app.use(cookieParser());

/**
 * 🧠 Database Connection
 */
connectDB();
 app.get('/', (req, res) => { res.send('Hello, Express.js server is running!'); });
/**
 * 🚏 API Routes
 */
app.use("/api/v1/user", userRoute);
app.use("/api/v1/course", courseRoute);
app.use("/api/v1/media", mediaRoute);
app.use("/api/v1/course-purchase", coursePurchaseRoute);
app.use("/api/v1/progress", courseProgressRoute);
app.use("/api/v1/course", streamRoute);
app.use("/api/v1/course", purchaseRoute);
app.use("/api/v1/contact", contactRoute);
app.use("/api/v1/roadmap", roadmapRoute);


/**
 * ❤️ Health Check (VERY IMPORTANT)
 */
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy 🚀",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
