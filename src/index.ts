// src/index.ts
import dotenv from "dotenv";
dotenv.config(); // Load .env variables FIRST. Remove path if .env is in project root.

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in development
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in development
});

import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes/authRoutes";
import connectDB from "./utils/db";
import cloudinary from "cloudinary";
import bodyParser from "body-parser";
import path from "path";
import dashboardRouter from "./routes/authDashboard";
import passwordResetRoutes from "./routes/passwordResetRoutes";
import adminManagementRoutes from "./routes/adminManagementRoutes";
import request from "request";
import * as cheerio from 'cheerio';
import puppeteer from "puppeteer";
import { iframeStyles } from "./utils/styles";
import { generalRateLimiter } from "./middlewares/rateLimiter";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import logger from "./utils/logger";
import { isRedisHealthy } from "./utils/redis";
import { getCacheStats } from "./middlewares/cacheMiddleware";
import mongoose from "mongoose";

// Call the connectDB function to establish the database connection
connectDB();

// Setting up cloudinary configuration
// SECURITY WARNING: Hardcoding credentials is risky. Use environment variables.
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "ddbiofmni", 
  api_key: process.env.CLOUDINARY_API_KEY || "629285927862696", 
  api_secret: process.env.CLOUDINARY_API_SECRET || "7i7owfVVo3t860usBWvJqTITMHY",
});

const app = express();

// Set timeout for all requests to prevent hanging (30 seconds)
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  res.setTimeout(30000);
  next();
});

app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Use body-parser middleware with increased limit
// app.use(express.json({ limit: "50mb" }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Use cookie-parser middleware
app.use(cookieParser());

// SECURITY: Apply rate limiting to all API routes
// Protects against DDoS, brute force, and API abuse
// Limit: 100 requests per 15 minutes per IP for authenticated routes
app.use("/api", generalRateLimiter);

// Mount the routes under the '/api' prefix
app.use("/api", routes);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/password", passwordResetRoutes);
app.use("/api/admin", adminManagementRoutes);

/**
 * Health Check Endpoint
 * GET /health
 * 
 * Purpose: Monitor server health and dependencies
 * Used by: Load balancers, monitoring tools, DevOps
 */
app.get('/health', async (req: Request, res: Response) => {

  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // Seconds since server started
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        status: 'unknown',
        connected: false,
      },
      redis: {
        status: 'unknown',
        connected: false,
      },
      cache: {
        stats: getCacheStats()
      }
    },
    system: {
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024), // MB
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024), // MB
      },
      cpu: process.cpuUsage(),
    }
  };

  try {
    // Check MongoDB connection
    healthCheck.services.database.connected = mongoose.connection.readyState === 1;
    healthCheck.services.database.status = healthCheck.services.database.connected ? 'healthy' : 'unhealthy';

    // Check Redis connection
    healthCheck.services.redis.connected = await isRedisHealthy();
    healthCheck.services.redis.status = healthCheck.services.redis.connected ? 'healthy' : 'unhealthy';

    // Overall status
    const allHealthy = healthCheck.services.database.connected && healthCheck.services.redis.connected;
    healthCheck.status = allHealthy ? 'ok' : 'degraded';

    const statusCode = allHealthy ? 200 : 503;
    res.status(statusCode).json(healthCheck);

  } catch (error: any) {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Error Handling Middleware (MUST be last)
// Catches 404 errors for routes that don't exist
app.use(notFoundHandler);

// Global error handler - catches all errors and formats responses consistently
app.use(errorHandler);

const PORT = process.env.PORT || 3003;

// Start server and handle errors
const server = app.listen(PORT, () => {
  logger.info(`✅ Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`API available at: http://localhost:${PORT}/api`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

// Handle server errors
server.on('error', (error: any) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  } else {
    logger.error('Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
