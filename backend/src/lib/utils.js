import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateToken = (userId, res) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true, // prevent XSS attacks: cross-site scripting
    sameSite: ENV.NODE_ENV !== "development" ? "none" : "strict", // CSRF attacks
    secure: ENV.NODE_ENV !== "development",
    partitioned: true,
  });

  return token;
};
