import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

const db = {};
db.prisma = prisma;
db.ROLES = ['user', 'admin', 'moderator'];

export default db;