import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { jwtConfig } from "../config/auth.config.js";
import { jwtDecrypt } from "jose";
import hkdf from "@panva/hkdf";
dotenv.config();

const getDerivedEncryptionKey = async (secret, salt) => {
  return await hkdf(
    "sha256",
    secret,
    salt,
    `NextAuth.js Generated Encryption Key${salt ? ` (${salt})` : ""}`,
    32
  );
};

const authMiddleware = async (req, res, next) => {
  console.log("Received cookies in authMiddleware:", req.cookies);
  const token = req.cookies["next-auth.session-token"];
  console.log("Value of token variable:", token);

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided!" });
  }

  try {
    const secret = process.env.JWT_SECRET || jwtConfig.secret;

    if (!secret) {
      throw new Error("JWT_SECRET is not defined in environment variables.");
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded; // The decoded payload contains user information
    console.log("Decoded JWT payload:", decoded);
    next();
  } catch (err) {
    console.error("Authentication error:", err);
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ message: "Forbidden: Invalid token." });
    }
    return res.status(403).json({ message: "Forbidden: Authentication failed." });
  }
};

export default authMiddleware;
