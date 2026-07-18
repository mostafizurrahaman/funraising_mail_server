import { AppError } from "@/app/errors";
import { Auth } from "./auth.model";
import type { TSignupPayload } from "./auth.validation";
import httpStatus, { status } from "http-status";
import { AuthRole, AuthStatus } from "./auth.constant";
import { hashPassword } from "@/app/utils/password";
import { configs } from "@/app/configs";
import type { TMulterFile } from "@/app/types/multer.types";
import uploadFileIntoCloudinary from "@/app/utils/upload-file-into-cloudinary";
import mongoose from "mongoose";
import { Company } from "../Company/company.model";
import { generateUniqueCompanyCode } from "../Company/company.utils";
import { geoLocationType } from "../Company/company.constants";
import { deleteFileByUrl } from "@/app/utils/delete-file-from-cloudinary";

// ? Organization Signup
const signupIntoDB = async (
   payload: TSignupPayload,
   profileImage: TMulterFile,
) => {
   const {
      name,
      email,
      phone,
      password,
      companyName,
      city,
      fleetSize,
      address,
      latitude,
      longitude,
      radiusKm,
      note,
   } = payload;

   // * Existing Account checking:
   const existingUser = await Auth.findOne({
      $or: [{ email }, { phone }],
   });

   if (existingUser) {
      const isSameInfo =
         existingUser.email === email && existingUser.phone === phone;

      const isForEmail = existingUser.email === email;
      const isForPhone = existingUser.phone === phone;

      // Same email & phone
      if (isSameInfo) {
         switch (existingUser.status) {
            case AuthStatus.ACTIVE:
               throw new AppError(
                  httpStatus.CONFLICT,
                  "You already have an account. Please log in.",
               );

            case AuthStatus.PENDING:
               throw new AppError(
                  httpStatus.CONFLICT,
                  "Your account is pending approval. Please wait for admin verification.",
               );

            case AuthStatus.BLOCKED:
               throw new AppError(
                  httpStatus.FORBIDDEN,
                  "Your account has been blocked. Please contact support.",
               );

            case AuthStatus.REJECTED:
               throw new AppError(
                  httpStatus.CONFLICT,
                  "Your previous application was rejected. Please submit a new application.",
               );
         }
      }

      // Only email exists
      if (isForEmail) {
         throw new AppError(
            httpStatus.CONFLICT,
            "An account already exists with this email address. Please log in or use a different email.",
         );
      }

      // Only phone exists
      if (isForPhone) {
         throw new AppError(
            httpStatus.CONFLICT,
            "An account already exists with this phone number. Please use a different phone number.",
         );
      }
   }

   // ** If profile image uploaded:
   const image = await uploadFileIntoCloudinary(profileImage, "/user/profiles");

   if (!image) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Failed to upload profile image!",
      );
   }

   const session = await mongoose.startSession();

   try {
      await session.startTransaction();

      // ** Hashing the password:
      const passwordHash = await hashPassword(
         password,
         configs.passwordSaltRound,
      );

      // ? Create user first:
      const [user] = await Auth.create(
         [
            {
               name,
               email,
               passwordHash,
               phone,
               profileImage: image?.url as string,
               status: AuthStatus.PENDING,
               role: AuthRole.COMPANY,
            },
         ],
         {
            session,
         },
      );

      if (!user) {
         throw new AppError(httpStatus.BAD_REQUEST, "Failed to create user.");
      }

      const companyCode = await generateUniqueCompanyCode();

      // Prepare the company profile:
      const [company] = await Company.create(
         [
            {
               user: user?._id,
               companyName,
               companyCode,
               city,
               fleetSize,
               address,
               serviceArea: {
                  type: geoLocationType.Point,
                  coordinates: [longitude, latitude],
               },
               radiusKm,
               note,
            },
         ],
         {
            session,
         },
      );

      if (!company) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to create company profile.",
         );
      }

      await session.commitTransaction();
      return user;
   } catch (error) {
      await deleteFileByUrl(image.url);
      console.log(error);
      await session.abortTransaction();
      throw error;
   } finally {
      await session.endSession();
   }
};

export const AuthServices = {
   signupIntoDB,
};
