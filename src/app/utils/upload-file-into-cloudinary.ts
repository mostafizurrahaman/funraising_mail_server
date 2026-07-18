import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";
import { AppError } from "../errors";
import httpStatus from "http-status";
import { configs } from "../configs";

cloudinary.config({
   cloud_name: configs?.cloudinaryCloudName,
   api_key: configs?.cloudinaryApiKey,
   api_secret: configs?.cloudinaryApiSecret,
});

const uploadFileIntoCloudinary = (
   file: Express.Multer.File,
   folder: string,
): Promise<UploadApiResponse | undefined> => {
   return new Promise((resolve, reject) => {
      const mimeType = file.mimetype.startsWith("video/") ? "video" : "image";
      const steam = cloudinary.uploader.upload_stream(
         {
            folder,
            resource_type: mimeType,
         },
         (err, result) => {
            if (err)
               return reject(
                  new AppError(
                     httpStatus.BAD_REQUEST,
                     `Failed to upload ${mimeType}`,
                  ),
               );

            resolve(result);
         },
      );

      streamifier.createReadStream(file.buffer).pipe(steam);
   });
};

export default uploadFileIntoCloudinary;
