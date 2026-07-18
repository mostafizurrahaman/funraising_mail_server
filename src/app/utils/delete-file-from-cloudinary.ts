import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { configs } from "../configs";

cloudinary.config({
   cloud_name: configs?.cloudinaryCloudName,
   api_key: configs?.cloudinaryApiKey,
   api_secret: configs?.cloudinaryApiSecret,
});

export const deleteFileByUrl = async (url: string) => {
   const parts = url.split("/upload/")[1];

   const publicId = parts
      ?.replace(/^v\d+\//, "")
      .replace(/\.[^/.]+$/, "") as string;

   return cloudinary.uploader.destroy(publicId);
};
