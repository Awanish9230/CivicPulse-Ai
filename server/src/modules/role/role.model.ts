import mongoose, { HydratedDocument } from 'mongoose';

export type RoleScope = 'Admin' | 'Authority' | 'Citizen';

export const SYSTEM_PERMISSIONS = [
    'manage_all_departments',
    'manage_departments',
    'manage_members',
    'manage_roles',
    'assign_tasks',
    'resolve_tasks',
    'escalate_tasks',
    'view_analytics',
    'manage_users',
    'manage_settings'
] as const;

export type SystemPermission = (typeof SYSTEM_PERMISSIONS)[number];

export interface IRole {
    name: string;
    slug: string;
    scope: RoleScope;
    description: string;
    permissions: string[];
    isSystem: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type RoleDocument = HydratedDocument<IRole>;

const roleSchema = new mongoose.Schema<IRole>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true
        },
        scope: {
            type: String,
            enum: ['Admin', 'Authority', 'Citizen'],
            default: 'Authority'
        },
        description: {
            type: String,
            default: ''
        },
        permissions: {
            type: [String],
            default: []
        },
        isSystem: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const Role = mongoose.model<IRole>('Role', roleSchema);
export default Role;
