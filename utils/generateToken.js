import jwt from "jsonwebtoken";

const generateToken = (res, payload, message = "Login successful") => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET not configured");
  }

  // ✅ payload = { userId, role }
  const token = jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
       httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export default generateToken;
