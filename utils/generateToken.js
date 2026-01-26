import jwt from "jsonwebtoken";
import { CONFIG } from "../config";

const generateToken = (res, payload, message = "Login successful") => {
  if (!CONFIG.jwtSecret) {
    throw new Error("JWT_SECRET not configured");
  }

  // ✅ payload = { userId, role }
  const token = jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
    },
    CONFIG.jwtSecret,
    { expiresIn: "7d" }
  );

  const isProduction = CONFIG.nodeEnv === "production";

  res.cookie("token", token, {
       httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export default generateToken;
