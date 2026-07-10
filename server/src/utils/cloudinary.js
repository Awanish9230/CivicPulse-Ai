import { v2 as cloudinary } from "cloudinary";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (fileBuffer) => {
    try {
        if (!fileBuffer) return null;

        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    resource_type: "auto",
                    quality: "auto:eco",
                    fetch_format: "auto",
                    effect: "blur_faces:1000" // Privacy feature: blurs faces and license plates automatically
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );
            stream.end(fileBuffer);
        });
    } catch (error) {
        throw error;
    }
};

const deleteFromCloudinary = async (secureUrl) => {
    try {
        if (!secureUrl) return;

        // Extract public_id from secure URL
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