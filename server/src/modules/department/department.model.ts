import mongoose, { HydratedDocument } from 'mongoose';

export interface IDepartment {
    name: string;
    code: string;
    categories: string[];
    description: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export type DepartmentDocument = HydratedDocument<IDepartment>;

const departmentSchema = new mongoose.Schema<IDepartment>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
            unique: true
        },
        categories: {
            type: [String],
            default: []
        },
        description: {
            type: String,
            default: ''
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

const DepartmentModel = mongoose.model<IDepartment>('Department', departmentSchema);
export default DepartmentModel;
