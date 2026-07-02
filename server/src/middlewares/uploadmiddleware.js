import multer from "multer"
import path from "path";
import crypto from "crypto";
import fs from "fs";

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        const tempPath = "./public/temp";
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath, { recursive: true });
        }
        cb(null, tempPath);
    },

    filename: function (req, file, cb) {

        const uniqueFilename =
            crypto.randomUUID() +
            path.extname(file.originalname);

        cb(null, uniqueFilename);
    }

});

export const upload = multer({
    storage,
});