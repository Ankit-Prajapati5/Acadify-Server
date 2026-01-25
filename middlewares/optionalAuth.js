import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const optionalAuth = async (req, res, next) => {
  try {
    let token;

    // 1️⃣ Cookie token
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // 2️⃣ Authorization header (optional)
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token || !process.env.JWT_SECRET) {
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(); // ❗ optional auth must never block
    }

    const user = await User.findById(decoded.userId).select(
      "_id name email role photoUrl"
    );

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
};

export default optionalAuth;
