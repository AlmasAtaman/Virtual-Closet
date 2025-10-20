import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import db from './app/models/index.js';
import authRoutes from './app/routes/auth.routes.js';
import userRoutes from './app/routes/user.routes.js';
import uploadRoutes from './app/routes/upload.js';
import outfitRoutes from './app/routes/outfit.routes.js';
import { scrapeProduct } from './app/scrape/quick.scrape.js';
import occasionRoutes from './app/routes/occasion.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// CORS - Simple and stable version
app.use(cors({
  origin: [
    "https://vestko.vercel.app",
    "https://vestko.com",
    "https://www.vestko.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:3003"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Body parsers with increased size limits for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie-session middleware
app.use(cookieParser());

//added code for AWS S3
app.use('/api/images', uploadRoutes); // So POST /images works

app.post('/api/scrape', scrapeProduct);
app.post('/api/quick-scrape', scrapeProduct);

// Routes
authRoutes(app);
userRoutes(app);
app.use('/api/outfits', outfitRoutes);
app.use('/api/occasions', occasionRoutes);

// Initial role seeding
async function initial() {
  try {
    const count = await db.prisma.role.count();
    if (count === 0) {
      await db.prisma.role.createMany({
        data: [
          { name: 'user' },
          { name: 'moderator' },
          { name: 'admin' }
        ]
      });
      console.log('✅ Initial roles seeded successfully');
    } else {
      console.log('✅ Database connected - roles already exist');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.error('Make sure your database is running and .env is configured correctly');
    // Don't exit - let the server run even if DB connection fails initially
  }
}

const server = app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await initial();
  console.log(`✅ Server ready to accept requests`);
});

// Prevent the process from exiting
server.on('listening', () => {
  console.log(`✅ Server is actively listening on port ${port}`);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Keep the process alive
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});