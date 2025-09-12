import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { jwtConfig } from "../config/auth.config.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { v4 as uuidv4 } from "uuid";

const prisma = db.prisma;

export const signup = async (req, res) => {
  try {
    const { username, email, password, roles } = req.body;

    const hashedPassword = bcrypt.hashSync(password, 8);
    const id = uuidv4(); // Generate a unique ID

    const user = await prisma.user.create({
      data: {
        id, // Add the generated ID here
        username,
        email,
        password: hashedPassword,
        roles: roles && roles.length > 0
          ? { connect: roles.map(role => ({ name: role })) }
          : { connect: [{ name: "user" }] },
      },
      include: {roles: true}
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      jwtConfig.secret,
      { expiresIn: '30d', algorithm: 'HS256', allowInsecureKeySizes: true }
    );

    const authorities = user.roles.map(role => `ROLE_${role.name.toUpperCase()}`);


    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "None",
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { roles: true }
    });

    if (!user) return res.status(404).send({ message: "User not found." });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(401).send({ message: "Invalid Password!" });

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      jwtConfig.secret,
      { expiresIn: '30d', algorithm: 'HS256', allowInsecureKeySizes: true }
    );


    const authorities = user.roles.map(role => `ROLE_${role.name.toUpperCase()}`);

    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "None",
        maxAge: 30 * 24 * 60 * 60 * 1000
      });

      
    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: authorities
    });

  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

export const signout = (req, res) => {
  // Clear all possible auth cookies
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "Lax"
  });
  
  // Clear any legacy NextAuth cookies if they exist
  res.clearCookie("next-auth.session-token");
  res.clearCookie("__Secure-next-auth.session-token");
  res.clearCookie("next-auth.csrf-token");
  res.clearCookie("__Host-next-auth.csrf-token");
  
  res.status(200).send({ message: "You've been signed out!" });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Send a generic success message even if email not found to prevent email enumeration
      return res.status(200).send({ message: "If an account with that email exists, a password reset link has been sent." });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: resetTokenExpires,
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;


    // Use the new sendEmail helper
    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      html: `
        <p>You requested a password reset</p>
        <p>Click this <a href="${resetUrl}">link</a> to reset your password.</p>
        <p>This link is valid for 1 hour.</p>
      `,
    });

    res.status(200).send({ message: "If an account with that email exists, a password reset link has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).send({ message: "An error occurred while processing your request." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { gt: new Date() }, // Check if token is not expired
      },
    });

    if (!user) {
      return res.status(400).send({ message: "Password reset token is invalid or has expired." });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 8);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.status(200).send({ message: "Your password has been reset successfully." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).send({ message: "An error occurred while processing your request." });
  }
};
