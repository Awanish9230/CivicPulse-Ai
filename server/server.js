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
import appealRoutes from './src/modules/appeal/appeal.routes.js';
import petitionRoutes from './src/modules/petition/petition.routes.js';
import startEscalationCron from './src/utils/escalationCron.js';

connectDB();
 
const app = express();

app.set('trust proxy', 1);

const server = http.createServer(app);

initSocket(server);

startEscalationCron();

app.use(helmet());

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        return callback(null, origin);
    },
    credentials: true,
}));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: process.env.NODE_ENV === 'development' ? 5000 : 500, 
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

app.use(compression());

app.use(express.json());

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));


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
app.use("/api/v1/appeal", appealRoutes);
app.use("/api/v1/petition", petitionRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});