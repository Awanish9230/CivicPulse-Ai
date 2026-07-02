import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import http from 'http';
import rateLimit from 'express-rate-limit';
import connectDB from './src/config/db.js';
import logger from './src/utils/logger.js';
import { notFound, errorHandler } from './src/middlewares/errorHandler.js';
import { initSocket } from './src/config/socket.js';
import cookieParser from "cookie-parser";

import userRoutes from './src/routes/userRoutes.js';
import complainRoutes from './src/routes/complainRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import authorityRoutes from './src/routes/authorityRoutes.js';
import adminRoutes from './src/routes/adminRoutes.js';
import publicRoutes from './src/routes/publicRoutes.js';
import startEscalationCron from './src/utils/escalationCron.js';

// Connect to database
connectDB();
 
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start Cron Jobs
startEscalationCron();

// Security middleware
app.use(helmet());

// Enable CORS (MUST be before Rate Limiter so 429 errors get CORS headers)
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, origin);
    },
    credentials: true,
}));

// Global Rate Limiting
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'development' ? 5000 : 500, // Increased limit for production dashboards
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Compression middleware
app.use(compression());

// Body parser
app.use(express.json());

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


// Routes
app.get('/', (req, res) => {
    res.send('CivicPulse API is running...');
});

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/complaint", complainRoutes);
app.use("/api/v1/notification", notificationRoutes);
app.use("/api/v1/message", messageRoutes);
app.use("/api/v1/authority", authorityRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/public", publicRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});