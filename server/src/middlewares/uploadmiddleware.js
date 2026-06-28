import multer from "multer"
import path from "path";
import crypto from "crypto";

const storage = multer.diskStorage({

    destination: function (req, file, cb) {
        cb(null, "./public/temp");
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