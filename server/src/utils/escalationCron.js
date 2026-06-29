import cron from 'node-cron';
import Complaint from '../models/Complaint.js';
import logger from './logger.js';

// Run every hour to check for complaints that need escalation
const startEscalationCron = () => {
    cron.schedule('0 * * * *', async () => {
        logger.info("Running scheduled escalation checks...");
        try {
            const now = new Date();

            // 1. Escalate Junior to Senior if no activity for 48 hours
            const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
            const juniorComplaints = await Complaint.find({
                escalationLevel: 'Junior',
                status: { $nin: ['Resolved', 'Closed', 'Rejected'] },
                lastActivityAt: { $lt: fortyEightHoursAgo }
            });

            for (const complaint of juniorComplaints) {
                complaint.escalationLevel = 'Senior';
                complaint.lastActivityAt = now;
                complaint.officialReplies.push({
                    authorityName: 'System Escalation',
                    content: 'Complaint automatically escalated to Senior level due to 48 hours of inactivity.'
                });
                await complaint.save();
                logger.info(`Escalated complaint ${complaint._id} to Senior`);
            }

            // 2. Escalate to HOD if not resolved in 7 days (from creation)
            const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            const unresolvedOldComplaints = await Complaint.find({
                escalationLevel: { $ne: 'HOD' },
                status: { $nin: ['Resolved', 'Closed', 'Rejected'] },
                createdAt: { $lt: sevenDaysAgo }
            });

            for (const complaint of unresolvedOldComplaints) {
                complaint.escalationLevel = 'HOD';
                complaint.lastActivityAt = now;
                complaint.officialReplies.push({
                    authorityName: 'System Escalation',
                    content: 'Complaint automatically escalated to Head of Department (HOD) level because it has been unresolved for 7 days.'
                });
                await complaint.save();
                logger.info(`Escalated complaint ${complaint._id} to HOD`);
            }
        } catch (error) {
            logger.error("Error in escalation cron:", error);
        }
    });
};

export default startEscalationCron;
