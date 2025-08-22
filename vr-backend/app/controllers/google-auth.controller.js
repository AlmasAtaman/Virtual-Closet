import { OAuth2Client } from 'google-auth-library';
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { jwtConfig } from "../config/auth.config.js";
import { v4 as uuidv4 } from "uuid";
import fetch from 'node-fetch';

const prisma = db.prisma;
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Original Google auth endpoint (for ID token verification)
export const googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: "Google token is required" });
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;

    // Check if user already exists with this Google ID
    let user = await prisma.user.findUnique({
      where: { googleId },
      include: { roles: true }
    });

    if (!user) {
      // Check if user exists with this email (manual registration)
      const existingEmailUser = await prisma.user.findUnique({
        where: { email },
        include: { roles: true }
      });

      if (existingEmailUser) {
        // Link the Google account to existing email user
        user = await prisma.user.update({
          where: { email },
          data: { googleId },
          include: { roles: true }
        });
      } else {
        // Create new user with Google account
        const newUserId = uuidv4();
        user = await prisma.user.create({
          data: {
            id: newUserId,
            username: email, // Use email as username for Google users
            email,
            googleId,
            password: null, // No password for Google users
            roles: { connect: [{ name: "user" }] },
          },
          include: { roles: true }
        });
      }
    }

    // Generate JWT token using the same format as manual login
    const jwtToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      jwtConfig.secret,
      { expiresIn: '30d', algorithm: 'HS256', allowInsecureKeySizes: true }
    );

    const authorities = user.roles.map(role => `ROLE_${role.name.toUpperCase()}`);

    // Set the same cookie as manual login
    res.cookie("accessToken", jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax", 
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      isGoogleUser: true
    });

  } catch (error) {
    console.error("Google auth error:", error);
    if (error.message && error.message.includes('Token used too early')) {
      return res.status(400).json({ message: "Token not yet valid. Please try again." });
    }
    res.status(500).json({ message: "Google authentication failed" });
  }
};

// New OAuth2 callback endpoint
export const googleCallback = async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    
    if (!code) {
      return res.status(400).json({ message: "Authorization code is required" });
    }

    console.log("Received OAuth code:", code);

    // Exchange authorization code for tokens
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri
    });

    console.log("Received tokens:", !!tokens.access_token, !!tokens.id_token);

    // Verify ID token and get user info
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name;

    console.log("Google user info:", { googleId, email, name });

    // Check if user already exists with this Google ID
    let user = await prisma.user.findUnique({
      where: { googleId },
      include: { roles: true }
    });

    if (!user) {
      // Check if user exists with this email (manual registration)
      const existingEmailUser = await prisma.user.findUnique({
        where: { email },
        include: { roles: true }
      });

      if (existingEmailUser) {
        // Link the Google account to existing email user
        user = await prisma.user.update({
          where: { email },
          data: { googleId },
          include: { roles: true }
        });
        console.log("Linked Google account to existing user:", user.id);
      } else {
        // Create new user with Google account
        const newUserId = uuidv4();
        user = await prisma.user.create({
          data: {
            id: newUserId,
            username: email, // Use email as username for Google users
            email,
            googleId,
            password: null, // No password for Google users
            roles: { connect: [{ name: "user" }] },
          },
          include: { roles: true }
        });
        console.log("Created new Google user:", user.id);
      }
    } else {
      console.log("Found existing Google user:", user.id);
    }

    // Generate JWT token using the same format as manual login
    const jwtToken = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      jwtConfig.secret,
      { expiresIn: '30d', algorithm: 'HS256', allowInsecureKeySizes: true }
    );

    const authorities = user.roles.map(role => `ROLE_${role.name.toUpperCase()}`);

    // Set the same cookie as manual login
    res.cookie("accessToken", jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax", 
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    console.log("Google OAuth successful for user:", user.id);

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities,
      isGoogleUser: true
    });

  } catch (error) {
    console.error("Google OAuth callback error:", error);
    res.status(500).json({ message: "Google authentication failed" });
  }
};