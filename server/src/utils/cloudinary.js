import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload file to Cloudinary with compression parameters
        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto",
                quality: "auto:eco",
                fetch_format: "auto",
            }
        );

        // Delete local file after successful upload
        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        // Delete local file even if upload fails
        if (localFilePath) {
            fs.unlinkSync(localFilePath);
        }
        throw error;
    }
};

const deleteFromCloudinary = async (secureUrl) => {
    try {
        if (!secureUrl) return;

        // Extract public_id from secure URL
        // Typical URL: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/public_id.jpg
        const splitUrl = secureUrl.split('/');
        const filename = splitUrl[splitUrl.length - 1];
        const publicId = filename.split('.')[0];
        
        // Use cloudinary API to destroy the asset
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
export default uploadOnCloudinary;