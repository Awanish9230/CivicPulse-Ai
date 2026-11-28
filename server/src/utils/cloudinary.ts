import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (fileBuffer?: Buffer): Promise<UploadApiResponse | null> => {
    if (!fileBuffer) return null;

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: "auto",
                quality: "auto:eco",
                fetch_format: "auto",
                effect: "blur_faces:1000"
            },
            (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result ?? null);
                }
            }
        );
        stream.end(fileBuffer);
    });
};

const deleteFromCloudinary = async (secureUrl?: string): Promise<void> => {
    try {
        if (!secureUrl) return;

        const splitUrl = secureUrl.split('/');
        const filename = splitUrl[splitUrl.length - 1];
        const publicId = filename.split('.')[0];

        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
    }
};

export { uploadOnCloudinary, deleteFromCloudinary };
export default uploadOnCloudinary;
