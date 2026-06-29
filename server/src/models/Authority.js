import mongoose from 'mongoose';

const authoritySchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    department: {
        type: String, // e.g., 'Roads', 'Sanitation', 'Water'
        required: true,
    },
    role: {
        type: String,
        enum: ['Officer', 'Supervisor', 'Commissioner'],
        default: 'Officer'
    },
    permissions: {
        type: [String],
        default: ['view_assigned', 'update_status']
    },
    // Tokens for dashboard authentication
    refreshToken: {
        type: String,
    }
}, {
    timestamps: true,
});

const Authority = mongoose.model('Authority', authoritySchema);
export default Authority;
