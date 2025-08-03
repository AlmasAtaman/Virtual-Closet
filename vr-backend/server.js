import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import db from './app/models/index.js';
import authRoutes from './app/routes/auth.routes.js';
import userRoutes from './app/routes/user.routes.js';
import uploadRoutes from './app/routes/upload.js';
import outfitRoutes from './app/routes/outfit.routes.js';
import { scrapeProduct } from './app/scrape/scrape.controller.js';
import { scrapeProduct as quickScrapeProduct } from './app/scrape/quick.scrape.js';
import occasionRoutes from './app/routes/occasion.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// CORS
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true 
}));

// Body parsers with increased size limits for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie-session middleware
app.use(cookieParser());

//added code for AWS S3
app.use('/api/images', uploadRoutes); // So POST /images works

app.post('/api/scrape', scrapeProduct);
app.post('/api/quick-scrape', quickScrapeProduct);


// Routes
authRoutes(app);
userRoutes(app);
app.use('/api/outfits', outfitRoutes);
app.use('/api/occasions', occasionRoutes);

// Initial role seeding
async function initial() {
  const count = await db.prisma.role.count();
  if (count === 0) {
    await db.prisma.role.createMany({
      data: [
        { name: 'user' },
        { name: 'moderator' },
        { name: 'admin' }
      ]
    });
    console.log("Seeded roles: user, moderator, admin");
  }
}

app.get("/debug/cookies", (req, res) => {
  console.log("Cookies received:", req.cookies);
  res.send(req.cookies);
});

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await initial();
});
