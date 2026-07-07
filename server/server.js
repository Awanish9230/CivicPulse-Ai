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

import userRoutes from './src/modules/user/user.routes.js';
import complainRoutes from './src/modules/complaint/complaint.routes.js';
import notificationRoutes from './src/modules/notification/notification.routes.js';
import messageRoutes from './src/modules/message/message.routes.js';
import authorityRoutes from './src/modules/authority/authority.routes.js';
import adminRoutes from './src/modules/admin/admin.routes.js';
import publicRoutes from './src/modules/public/public.routes.js';
import startEscalationCron from './src/utils/escalationCron.js';

// Connect to database
connectDB();
 
const app = express();

// Trust reverse proxies (like Render) to fix express-rate-limit IP issues
app.set('trust proxy', 1);

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