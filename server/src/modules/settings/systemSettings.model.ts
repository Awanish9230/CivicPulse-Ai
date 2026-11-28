import mongoose, { HydratedDocument } from 'mongoose';

export interface IEscalationRuleSettings {
    juniorToSeniorDays: number;
    seniorToHodDays: number;
    autoAssignEnabled: boolean;
}

export interface ISystemSettings {
    key: string;
    escalationRules: IEscalationRuleSettings;
    updatedAt: Date;
    createdAt: Date;
}

export type SystemSettingsDocument = HydratedDocument<ISystemSettings>;

const systemSettingsSchema = new mongoose.Schema<ISystemSettings>(
    {
        key: {
            type: String,
            default: 'global',
            unique: true
        },
        escalationRules: {
            juniorToSeniorDays: {
                type: Number,
                default: 5,
                min: 1,
                max: 60
            },
            seniorToHodDays: {
                type: Number,
                default: 14,
                min: 2,
                max: 120
            },
            autoAssignEnabled: {
                type: Boolean,
                default: true
            }
        }
    },
    { timestamps: true }
);

const SystemSettings = mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);

export const getGlobalSystemSettings = async (): Promise<SystemSettingsDocument> => {
    let doc = await SystemSettings.findOne({ key: 'global' });
    if (!doc) {
        doc = await SystemSettings.create({
            key: 'global',
            escalationRules: {
                juniorToSeniorDays: 5,
                seniorToHodDays: 14,
                autoAssignEnabled: true
            }
        });
    }
    return doc;
};

export default SystemSettings;
