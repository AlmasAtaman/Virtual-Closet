import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { jwtConfig } from "../config/auth.config.js";
dotenv.config();

const authMiddleware = async (req, res, next) => {
  // Check for token in cookies (our unified auth system)
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided!" });
  }

  try {
    // Use our custom JWT secret for all tokens
    const secret = process.env.JWT_SECRET || jwtConfig.secret;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables.");
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    console.log("User authenticated:", req.user);
    next();
    
  } catch (err) {
    console.error("Authentication error:", err.message);
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: "Forbidden: Invalid token." });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Unauthorized: Token expired." });
    }
    return res.status(403).json({ message: "Forbidden: Authentication failed." });
  }
};

export default authMiddleware;