import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../models/index.js";
import { jwtConfig } from "../config/auth.config.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import { v4 as uuidv4 } from "uuid";
import { deleteFileFromS3 } from "../utils/s3Helpers.js";

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
        secure: true, // Required for sameSite: "None" to work on mobile
        sameSite: "None",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/' // Explicitly set path
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
        secure: true, // Required for sameSite: "None" to work on mobile
        sameSite: "None",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/' // Explicitly set path
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
  try {
    // Clear the main accessToken cookie with matching options
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: '/'
    });

    // Clear any legacy NextAuth cookies if they exist
    res.clearCookie("next-auth.session-token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: '/'
    });
    res.clearCookie("__Secure-next-auth.session-token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: '/'
    });
    res.clearCookie("next-auth.csrf-token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: '/'
    });
    res.clearCookie("__Host-next-auth.csrf-token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: '/'
    });

    res.status(200).send({ message: "You've been signed out!" });
  } catch (err) {
    console.error("Signout error:", err);
    res.status(500).send({ message: "An error occurred during signout." });
  }
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

    // Create professional HTML email template
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #1a1a1a;">Password Reset Request</h1>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding: 0 40px 30px 40px;">
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                      Hello,
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 24px; color: #4a5568;">
                      We received a request to reset your password for your Vestko account. Click the button below to create a new password:
                    </p>

                    <!-- Button -->
                    <table role="presentation" style="margin: 30px 0; width: 100%;">
                      <tr>
                        <td align="center">
                          <a href="${resetUrl}" style="display: inline-block; padding: 14px 40px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600;">Reset Password</a>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 20px 0; font-size: 14px; line-height: 20px; color: #718096;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 20px; color: #3182ce; word-break: break-all;">
                      ${resetUrl}
                    </p>

                    <!-- Warning Box -->
                    <table role="presentation" style="width: 100%; margin: 30px 0; border-left: 4px solid #f59e0b; background-color: #fffbeb;">
                      <tr>
                        <td style="padding: 16px 20px;">
                          <p style="margin: 0; font-size: 14px; line-height: 20px; color: #92400e;">
                            <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 20px; color: #718096;">
                      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; border-top: 1px solid #e2e8f0;">
                    <p style="margin: 0; font-size: 12px; line-height: 18px; color: #a0aec0; text-align: center;">
                      This email was sent by Vestko. If you have any questions, please contact our support team.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; line-height: 18px; color: #a0aec0; text-align: center;">
                      &copy; ${new Date().getFullYear()} Vestko. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send the password reset email
    await sendEmail({
      email: user.email,
      subject: 'Reset Your Vestko Password',
      html: emailHtml,
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

// Account Management Controllers

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch all user's clothing items to get their S3 keys
    const clothingItems = await prisma.clothing.findMany({
      where: { userId },
      select: { key: true }
    });

    // Delete all associated images from S3
    const deletePromises = clothingItems.map(item =>
      deleteFileFromS3(item.key).catch(err => {
        console.error(`Failed to delete S3 file ${item.key}:`, err);
        // Continue even if some S3 deletions fail
      })
    );
    await Promise.all(deletePromises);

    // Delete the user (cascade will handle clothing, outfits, and occasions)
    await prisma.user.delete({
      where: { id: userId }
    });

    // Clear the accessToken cookie
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: '/'
    });

    res.status(200).send({ message: "Your account has been deleted successfully." });
  } catch (err) {
    console.error("Delete account error:", err);
    res.status(500).send({ message: "An error occurred while deleting your account." });
  }
};

export const changeEmail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newEmail, password } = req.body;

    if (!newEmail || !password) {
      return res.status(400).send({ message: "New email and password are required." });
    }

    // Verify user's current password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // Check if user has a password (Google OAuth users might not)
    if (!user.password) {
      return res.status(400).send({ message: "Cannot change email for OAuth accounts using this method." });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).send({ message: "Invalid password." });
    }

    // Check if new email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail }
    });

    if (existingUser) {
      return res.status(400).send({ message: "This email is already in use." });
    }

    // Update email
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail }
    });

    // Generate new JWT with updated email
    const token = jwt.sign(
      { id: updatedUser.id, username: updatedUser.username, email: updatedUser.email },
      jwtConfig.secret,
      { expiresIn: '30d', algorithm: 'HS256', allowInsecureKeySizes: true }
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    res.status(200).send({
      message: "Email updated successfully.",
      email: updatedUser.email
    });
  } catch (err) {
    console.error("Change email error:", err);
    res.status(500).send({ message: "An error occurred while updating your email." });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).send({ message: "Current password and new password are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).send({ message: "New password must be at least 6 characters long." });
    }

    // Verify user's current password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    // Check if user has a password (Google OAuth users might not)
    if (!user.password) {
      return res.status(400).send({ message: "Cannot change password for OAuth accounts." });
    }

    const validPassword = bcrypt.compareSync(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).send({ message: "Current password is incorrect." });
    }

    // Update password
    const hashedPassword = bcrypt.hashSync(newPassword, 8);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.status(200).send({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).send({ message: "An error occurred while updating your password." });
  }
};
