import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import http from 'http';
import connectDB from './src/config/db.js';
import logger from './src/utils/logger.js';
import { notFound, errorHandler } from './src/middlewares/errorHandler.js';
import { initSocket } from './src/config/socket.js';
import cookieParser from "cookie-parser";

import userRouter from "./src/routes/userRoutes.js";
import complaintRouter from "./src/routes/complainRoutes.js";
import notificationRouter from "./src/routes/notificationRoutes.js";
// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Security middleware
app.use(helmet());

// Compression middleware
app.use(compression());

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        return callback(null, origin);
    },
    credentials: true,
}));
//
app.use(cookieParser());
//
app.use(express.urlencoded({ extended: true }));


// Routes
app.get('/', (req, res) => {
    res.send('CivicPulse API is running...');
});
//user Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/complaint", complaintRouter);
app.use("/api/v1/notification", notificationRouter);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});