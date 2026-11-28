import cron from 'node-cron';
import Complaint from '../modules/complaint/complaint.model.js';
import {
    getGlobalSystemSettings,
    IEscalationRuleSettings
} from '../modules/settings/systemSettings.model.js';
import logger from './logger.js';

export interface EscalationSweepSummary {
    escalatedToSenior: number;
    escalatedToHod: number;
    juniorToSeniorDays: number;
    seniorToHodDays: number;
}

export const runEscalationSweep = async (
    now: Date = new Date(),
    rulesOverride?: Partial<IEscalationRuleSettings>
): Promise<EscalationSweepSummary> => {
    const settingsDoc = rulesOverride ? null : await getGlobalSystemSettings();
    const juniorToSeniorDays = rulesOverride?.juniorToSeniorDays ?? settingsDoc?.escalationRules.juniorToSeniorDays ?? 5;
    const seniorToHodDays = rulesOverride?.seniorToHodDays ?? settingsDoc?.escalationRules.seniorToHodDays ?? 14;

    const juniorCutoff = new Date(now.getTime() - juniorToSeniorDays * 24 * 60 * 60 * 1000);
    const juniorComplaints = await Complaint.find({
        escalationLevel: 'Junior',
        status: { $nin: ['Resolved', 'Closed', 'Rejected'] },
        lastActivityAt: { $lt: juniorCutoff }
    });

    let escalatedToSenior = 0;
    for (const complaint of juniorComplaints) {
        complaint.escalationLevel = 'Senior';
        complaint.lastActivityAt = now;
        complaint.officialReplies.push({
            authorityName: 'System Escalation',
            content: `Complaint automatically escalated to Senior level after ${juniorToSeniorDays} days of inactivity.`
        });
        await complaint.save();
        escalatedToSenior += 1;
        logger.info(`Escalated complaint ${complaint._id} to Senior (${juniorToSeniorDays}d rule)`);
    }

    const hodCutoff = new Date(now.getTime() - seniorToHodDays * 24 * 60 * 60 * 1000);
    const unresolvedOldComplaints = await Complaint.find({
        escalationLevel: { $ne: 'HOD' },
        status: { $nin: ['Resolved', 'Closed', 'Rejected'] },
        createdAt: { $lt: hodCutoff }
    });

    let escalatedToHod = 0;
    for (const complaint of unresolvedOldComplaints) {
        complaint.escalationLevel = 'HOD';
        complaint.lastActivityAt = now;
        complaint.officialReplies.push({
            authorityName: 'System Escalation',
            content: `Complaint automatically escalated to Head of Department (HOD) level after remaining unresolved for ${seniorToHodDays} days.`
        });
        await complaint.save();
        escalatedToHod += 1;
        logger.info(`Escalated complaint ${complaint._id} to HOD (${seniorToHodDays}d rule)`);
    }

    return {
        escalatedToSenior,
        escalatedToHod,
        juniorToSeniorDays,
        seniorToHodDays
    };
};

const startEscalationCron = (): void => {
    cron.schedule('0 * * * *', async () => {
        logger.info('Running scheduled escalation checks...');
        try {
            await runEscalationSweep(new Date());
        } catch (error) {
            logger.error('Error in escalation cron:', error);
        }
    });
};

export default startEscalationCron;
