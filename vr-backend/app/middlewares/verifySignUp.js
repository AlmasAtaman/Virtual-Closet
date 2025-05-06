import db from "../models/index.js"; // Prisma client
const prisma = db.prisma;
const ROLES = db.ROLES;

const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    const { username, email } = req.body;

    const userByUsername = await prisma.user.findUnique({ where: { username } });
    if (userByUsername) {
      return res.status(400).send({ message: "Username is already in use!" });
    }

    const userByEmail = await prisma.user.findUnique({ where: { email } });
    if (userByEmail) {
      return res.status(400).send({ message: "Email is already in use!" });
    }

    next();
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
};

const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let role of req.body.roles) {
      if (!ROLES.includes(role)) {
        return res.status(400).send({
          message: `Role '${role}' does not exist!`
        });
      }
    }
  }
  next();
};

export const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted
};
