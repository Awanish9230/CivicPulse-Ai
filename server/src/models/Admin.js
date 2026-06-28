import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    // Super admin password should ideally be hardcoded in ENV, 
    // but this schema is for database-level audits/sessions if needed.
    role: {
        type: String,
        default: 'SuperAdmin'
    }
}, {
    timestamps: true,
});

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
