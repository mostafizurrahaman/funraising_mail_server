import { AppError } from "@/app/errors";
import { AuthRole, AuthStatus } from "../Auth/auth.constant";
import { Auth } from "../Auth/auth.model";
import type { TCreateDriverPayload } from "./driver.validation";
import httpStatus from "http-status";
import type { IAuthDoc } from "../Auth/auth.interface";
import type { TMulterFile } from "@/app/types/multer.types";
import uploadFileIntoCloudinary from "@/app/utils/upload-file-into-cloudinary";
import mongoose from "mongoose";
import { hashPassword } from "@/app/utils/password";
import { configs } from "@/app/configs";
import { Driver } from "./driver.model";
import { deleteFileByUrl } from "@/app/utils/delete-file-from-cloudinary";

const createDriverIntoDB = async (
   auth: IAuthDoc,
   payload: TCreateDriverPayload,
   profileImage: TMulterFile,
) => {
   const { name, email, password, phone, vehicleDetails } = payload;

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
                  "Your account has been rejected by admin. Please contact support.",
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
   const image = await uploadFileIntoCloudinary(
      profileImage,
      "/driver/profiles",
   );

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
               status: AuthStatus.ACTIVE,
               isVerified: true,
               role: AuthRole.DRIVER,
            },
         ],
         {
            session,
         },
      );

      if (!user) {
         throw new AppError(httpStatus.BAD_REQUEST, "Failed to create user.");
      }

      // Prepare the company profile:
      const [driver] = await Driver.create(
         [
            {
               user: user?._id,
               vehicleDetails,
               company: auth._id,
            },
         ],
         {
            session,
         },
      );

      if (!driver) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to create driver profile.",
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

export const DriverServices = {
   createDriverIntoDB,
};
