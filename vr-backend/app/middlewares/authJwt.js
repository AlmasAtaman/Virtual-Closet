import jwt from "jsonwebtoken";
import { jwtConfig } from "../config/auth.config.js";
import db from "../models/index.js";

const prisma = db.prisma;

const verifyToken = (req, res, next) => {
  const token = req.session.token;

  if (!token) return res.status(403).send({ message: "No token provided!" });

  jwt.verify(token, jwtConfig.secret, (err, decoded) => {
    if (err) return res.status(401).send({ message: "Unauthorized!" });

    req.userId = decoded.id;
    next();
  });
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { roles: true },
    });

    if (user.roles.some(role => role.name === "admin")) {
      return next();
    }

    return res.status(403).send({ message: "Require Admin Role!" });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

const isModerator = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { roles: true },
    });

    if (user.roles.some(role => role.name === "moderator")) {
      return next();
    }

    return res.status(403).send({ message: "Require Moderator Role!" });
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
};

export const authJwt = {
  verifyToken,
  isAdmin,
  isModerator,
};
    