import express from 'express';
import {
    getPlatformStats,
    getCategoryStats,
    getPublicMapData,
    getRecentReports,
    getLeaderboard,
    getLiveActivity,
    getPublicPetitions
} from './public.controller.js';

const router = express.Router();

router.route('/stats').get(getPlatformStats);
router.route('/categories').get(getCategoryStats);
router.route('/map').get(getPublicMapData);
router.route('/recent').get(getRecentReports);
router.route('/leaderboard').get(getLeaderboard);
router.route('/activity').get(getLiveActivity);
router.route('/petitions').get(getPublicPetitions);

export default router;
