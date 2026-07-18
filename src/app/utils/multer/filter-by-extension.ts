import type {
   FileExtension,
   FileValidationConfig,
} from "@/app/types/multer.types";
import httpStatus from "http-status";
import { FILE_CATEGORY_MAP } from "./constant";
import { AppError } from "@/app/errors";

export const isFileExtensionAllowed = (
   filename: string,
   config: FileValidationConfig,
) => {
   const extension = filename.split(".").pop()?.toLowerCase();

   if (!extension) return false;

   const allowedExtensions: readonly FileExtension[] =
      config.allowedExtensions ??
      (config?.category ? FILE_CATEGORY_MAP?.[config.category!] : []);

   if (!allowedExtensions.length) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "File filter config is invalid: no extensions defined",
      );
   }

   return allowedExtensions.includes(extension as FileExtension);
};
