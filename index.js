import dotenv from "dotenv";
// Local ke liye
dotenv.config();
import express from "express";
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
import quizRoutes from "./routes/quiz.route.js";


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

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL, // production frontend url
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/**
 * 🌐 Global Middlewares
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

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
app.use("/api/v1/quiz", quizRoutes);



/**
 * ❤️ Health Check (VERY IMPORTANT)
 */
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy 🚀",
  });
});

app.listen(PORT,() => {
  console.log(`🚀 Server running on port ${PORT}`);
});
