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

        // Upload file to Cloudinary
        const response = await cloudinary.uploader.upload(
            localFilePath,
            {
                resource_type: "auto",
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

export default uploadOnCloudinary;