import { AppError } from "@/app/errors";
import { Auth } from "./auth.model";
import type { TLoginPayload, TSignupPayload } from "./auth.validation";
import httpStatus, { status } from "http-status";
import { AuthPermission, AuthRole, AuthStatus } from "./auth.constant";
import { comparePassword, hashPassword } from "@/app/utils/password";
import { configs } from "@/app/configs";
import type { TMulterFile } from "@/app/types/multer.types";
import uploadFileIntoCloudinary from "@/app/utils/upload-file-into-cloudinary";
import mongoose, { Types, type PipelineStage } from "mongoose";
import { Company } from "../Company/company.model";
import { generateUniqueCompanyCode } from "../Company/company.utils";
import { geoLocationType } from "../Company/company.constants";
import { deleteFileByUrl } from "@/app/utils/delete-file-from-cloudinary";
import type { IJwtUserPayload } from "@/app/types";
import { createToken } from "@/app/utils";
import type { IAuthDoc } from "./auth.interface";

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

// ? Login:
const organizationLogin = async (payload: TLoginPayload) => {
   const { email, password } = payload;

   // ? Check is user exists ?
   const existingUser = await Auth.findOne({
      email,
   }).select("+passwordHash");

   if (!existingUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User doesn't exists");
   }

   // ? Match  the password:
   const isPasswordMatched = await comparePassword(
      password,
      existingUser.passwordHash,
   );
   if (!isPasswordMatched) {
      throw new AppError(httpStatus.BAD_REQUEST, "Credential not matched!");
   }

   // ?? Check is this user organization:
   if (existingUser?.role !== "company") {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "Only company accounts can access the organization portal.",
      );
   }

   // ? check is user statuses ?:
   if (existingUser.status === AuthStatus.PENDING) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Your account is pending approval. Please wait for admin verification.",
      );
   }

   if (
      existingUser.status === AuthStatus.BLOCKED ||
      existingUser.status === AuthStatus.REJECTED
   ) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         `Your account has been ${existingUser.status?.toLowerCase()}. Please contact support.`,
      );
   }

   // ?? Jwt payload:
   const jwtPayload: IJwtUserPayload = {
      _id: existingUser?._id?.toString(),
      name: existingUser.name!,
      email: existingUser?.email,
      phone: existingUser?.phone!,
      profileImage: existingUser.profileImage!,
      role: existingUser.status!,
      status: existingUser.status!,
   };

   // ?? Generate the access token and refresh token:
   const accessToken = createToken(
      jwtPayload,
      configs.accessTokenSecret,
      configs.accessTokenExpiresIn,
   );
   const refreshToken = createToken(
      jwtPayload,
      configs.refreshTokenSecret,
      configs.refreshTokenExpiresIn,
   );

   return {
      accessToken,
      refreshToken,
      email: existingUser.email,
      role: existingUser?.role,
   };
};

// ?? Admin login:
const adminLogin = async (payload: TLoginPayload) => {
   const { email, password } = payload;

   // ? Check is user exists ?
   const existingUser = await Auth.findOne({
      email,
   }).select("+passwordHash");

   if (!existingUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User doesn't exists");
   }

   // ? Match  the password:
   const isPasswordMatched = await comparePassword(
      password,
      existingUser.passwordHash,
   );
   if (!isPasswordMatched) {
      throw new AppError(httpStatus.BAD_REQUEST, "Credential not matched!");
   }

   // ?? Check is this user admin or super admin:
   if (AuthPermission?.[existingUser.role] < AuthPermission[AuthRole.ADMIN]) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "You don't have permission to login into this portal.",
      );
   }

   // ? check is user statuses ?:
   if (existingUser.status === AuthStatus.PENDING) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Your account is pending approval. Please wait for admin verification.",
      );
   }

   if (
      existingUser.status === AuthStatus.BLOCKED ||
      existingUser.status === AuthStatus.REJECTED
   ) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         `Your account has been ${existingUser.status?.toLowerCase()}. Please contact support.`,
      );
   }

   // ?? Jwt payload:
   const jwtPayload: IJwtUserPayload = {
      _id: existingUser?._id?.toString(),
      name: existingUser.name!,
      email: existingUser?.email,
      phone: existingUser?.phone!,
      profileImage: existingUser.profileImage!,
      role: existingUser.status!,
      status: existingUser.status!,
   };

   // ?? Generate the access token and refresh token:
   const accessToken = createToken(
      jwtPayload,
      configs.accessTokenSecret,
      configs.accessTokenExpiresIn,
   );
   const refreshToken = createToken(
      jwtPayload,
      configs.refreshTokenSecret,
      configs.refreshTokenExpiresIn,
   );

   return {
      accessToken,
      refreshToken,
      email: existingUser.email,
      role: existingUser?.role,
   };
};

// ?? Driver login:
const driverLogin = async (payload: TLoginPayload) => {
   const { email, password } = payload;

   // ? Check is user exists ?
   const existingUser = await Auth.findOne({
      email,
   }).select("+passwordHash");

   if (!existingUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User doesn't exists");
   }

   // ? Match  the password:
   const isPasswordMatched = await comparePassword(
      password,
      existingUser.passwordHash,
   );
   if (!isPasswordMatched) {
      throw new AppError(httpStatus.BAD_REQUEST, "Credential not matched!");
   }

   // ?? Check is this user driver?:
   if (AuthPermission?.[existingUser.role] < AuthPermission[AuthRole.DRIVER]) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "You don't have permission to login into this portal.",
      );
   }

   // ? check is user statuses ?:
   if (existingUser.status === AuthStatus.PENDING) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Your account is pending approval. Please wait for admin verification.",
      );
   }

   if (
      existingUser.status === AuthStatus.BLOCKED ||
      existingUser.status === AuthStatus.REJECTED
   ) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         `Your account has been ${existingUser.status?.toLowerCase()}. Please contact support.`,
      );
   }

   // ?? Jwt payload:
   const jwtPayload: IJwtUserPayload = {
      _id: existingUser?._id?.toString(),
      name: existingUser.name!,
      email: existingUser?.email,
      phone: existingUser?.phone!,
      profileImage: existingUser.profileImage!,
      role: existingUser.status!,
      status: existingUser.status!,
   };

   // ?? Generate the access token and refresh token:
   const accessToken = createToken(
      jwtPayload,
      configs.accessTokenSecret,
      configs.accessTokenExpiresIn,
   );
   const refreshToken = createToken(
      jwtPayload,
      configs.refreshTokenSecret,
      configs.refreshTokenExpiresIn,
   );

   return {
      accessToken,
      refreshToken,
      email: existingUser.email,
      role: existingUser?.role,
   };
};

// ?? Get profile From Db:
const getProfileFromDB = async (user: IAuthDoc) => {
   console.log(user);
   const pipeline: PipelineStage[] = [
      {
         $match: {
            _id: user?._id,
         },
      },
      {
         $project: {
            passwordHash: 0,
         },
      },
   ];

   const lookupCollection =
      user.role === AuthRole.COMPANY
         ? "companies"
         : user.role === AuthRole.DRIVER
           ? "drivers"
           : null;

   if (lookupCollection) {
      pipeline.push({
         $lookup: {
            from: lookupCollection,
            localField: "_id",
            foreignField: "user",
            as: "profileDetails",
         },
      });

      pipeline.push({
         $unwind: {
            path: "$profileDetails",
            preserveNullAndEmptyArrays: true,
         },
      });
   }
   pipeline.push({
      $unwind: {
         path: "$profileDetails",
         preserveNullAndEmptyArrays: true,
      },
   });

   const projection: Record<string, unknown> = {
      _id: 0,
      userId: "$_id",
      name: "$name",
      email: "$email",
      phone: "$phone",
      profileImage: {
         $ifNull: ["$profileImage", null],
      },
      role: "$role",
      status: "$status",
      isVerified: "$isVerified",
      createdAt: "$createdAt",
      updatedAt: "$updatedAt",
   };

   if (user.role === AuthRole.DRIVER) {
      projection["vehicleDetails"] = {
         $ifNull: ["$profileDetails.vehicleDetails", null],
      };

      projection["driverCompanyId"] = {
         $ifNull: ["$profileDetails.company", null],
      };
   }

   if (user.role === AuthRole.COMPANY) {
      projection["companyCode"] = {
         $ifNull: ["$profileDetails.companyCode", null],
      };

      projection["companyName"] = {
         $ifNull: ["$profileDetails.companyName", null],
      };
      projection["city"] = {
         $ifNull: ["$profileDetails.city", null],
      };
      projection["address"] = {
         $ifNull: ["$profileDetails.address", null],
      };
      projection["serviceArea"] = {
         $ifNull: ["$profileDetails.serviceArea", null],
      };
      projection["radiusKm"] = {
         $ifNull: ["$profileDetails.radiusKm", 0],
      };
      projection["fleetSize"] = {
         $ifNull: ["$profileDetails.fleetSize", 0],
      };
      projection["note"] = {
         $ifNull: ["$profileDetails.note", null],
      };
   }

   pipeline.push({
      $project: projection,
   });

   const profile = await Auth.aggregate(pipeline);

   console.dir(pipeline, { depth: Infinity });
   if (!profile?.[0]) {
      throw new AppError(httpStatus.NOT_FOUND, "User profile not found!");
   }
   return profile?.[0];
};

export const AuthServices = {
   signupIntoDB,
   organizationLogin,
   adminLogin,
   driverLogin,
   getProfileFromDB,
};
