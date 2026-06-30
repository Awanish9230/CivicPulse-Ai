import express from 'express';
import {
    getPlatformStats,
    getCategoryStats,
    getPublicMapData,
    getRecentReports,
    getLeaderboard
} from '../controllers/publicController.js';

const router = express.Router();

router.route('/stats').get(getPlatformStats);
router.route('/categories').get(getCategoryStats);
router.route('/map').get(getPublicMapData);
router.route('/recent').get(getRecentReports);
router.route('/leaderboard').get(getLeaderboard);

export default router;
