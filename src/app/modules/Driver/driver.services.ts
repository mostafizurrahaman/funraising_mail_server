import { AppError } from "../../errors";
import { AuthRole, AuthStatus } from "../Auth/auth.constant";
import { Auth } from "../Auth/auth.model";
import type {
   TSetNewPasswordPayloadType,
   TCreateDriverPayload,
   TGetAllDriverQuery,
   TUpdateStatusPayloadType,
} from "./driver.validation";
import httpStatus from "http-status";
import type { IAuth, IAuthDoc } from "../Auth/auth.interface";
import type { TMulterFile } from "../../types/multer.types";
import uploadFileIntoCloudinary from "../../utils/upload-file-into-cloudinary";
import mongoose, { Types, type PipelineStage } from "mongoose";
import { hashPassword } from "../../utils/password";
import { configs } from "../../configs";
import { Driver } from "./driver.model";
import { deleteFileByUrl } from "../../utils/delete-file-from-cloudinary";
import { driverSearchAbleFields } from "./driver.constant";
import {
   driverPasswordChangedTemplate,
   sendEmail,
} from "../../utils/send-email";
import { Booking, BookingStatus } from "../Booking";

// ** Create Driver **
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

// ** Get all drivers of your company **
const getAllDrivers = async (user: IAuthDoc, query: TGetAllDriverQuery) => {
   // ? destructure query :
   const {
      page: currentPage,
      limit: currentLimit,
      fromDate,
      toDate,
      status,
      searchTerm,
      sortBy = "createdAt",
      sortOrder = "desc",
   } = query;

   const page = Number(currentPage) || 1;
   const limit = Number(currentLimit) || 10;
   const skip = (page - 1) * limit;

   //  Only filter out the drivers :
   const pipeline: PipelineStage[] = [
      {
         $match: {
            role: AuthRole.DRIVER,
         },
      },
   ];

   // Status filter:
   if (status) {
      pipeline.push({
         $match: {
            status,
         },
      });
   }

   // Date filter:
   if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};

      if (fromDate) {
         dateFilter.$gte = new Date(fromDate);
      }
      if (toDate) {
         dateFilter.$lte = new Date(toDate);
      }

      pipeline.push({
         $match: {
            createdAt: dateFilter,
         },
      });
   }

   // ? Now lookup the driver information of this driver:
   pipeline.push({
      $lookup: {
         from: "drivers",
         localField: "_id",
         foreignField: "user",
         as: "profileDetails",
         pipeline: [
            {
               $lookup: {
                  from: "companies",
                  localField: "company",
                  foreignField: "user",
                  as: "companyDetails",
               },
            },
            {
               $unwind: {
                  path: "$companyDetails",
                  preserveNullAndEmptyArrays: true,
               },
            },
         ],
      },
   });

   pipeline.push({
      $unwind: {
         path: "$profileDetails",
         preserveNullAndEmptyArrays: true,
      },
   });

   // ? Do the final projection:
   pipeline.push({
      $project: {
         driverProfileId: "$profileDetails._id",
         name: "$name",
         companyId: "$profileDetails.company",
         companyName: "$profileDetails.companyDetails.companyName",
         companyCode: "$profileDetails.companyDetails.companyCode",

         vehicleDetails: "$profileDetails.vehicleDetails",

         email: "$email",
         phone: { $ifNull: ["$phone", null] },
         profileImage: { $ifNull: ["$profileImage", null] },
         isVerified: "$isVerified",
         status: "$status",
         role: "$role",
         createdAt: "$createdAt",
         updatedAt: "$updatedAt",
      },
   });

   // ? Do the search filters here:

   if (searchTerm) {
      pipeline.push({
         $match: {
            $or: driverSearchAbleFields.map((field) => ({
               [field]: {
                  $regex: searchTerm,
                  $options: "i",
               },
            })),
         },
      });
   }

   if (sortBy || sortOrder) {
      pipeline.push({
         $sort: {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
         },
      });
   }

   // ? Do facet for pagination
   pipeline.push({
      $facet: {
         data: [
            {
               $skip: skip,
            },
            {
               $limit: limit,
            },
         ],
         meta: [
            {
               $count: "total",
            },
         ],
      },
   });

   const result = await Auth.aggregate(pipeline);

   const data = result?.[0].data;
   const total = result?.[0]?.meta?.[0]?.total || 0;
   const totalPages = Math.ceil(total / limit);

   return {
      data,
      meta: {
         page,
         limit,
         total,
         totalPages,
      },
   };
};

const setNewPassword = async (
   user: IAuthDoc,
   driverId: string,
   payload: TSetNewPasswordPayloadType,
) => {
   const { newPassword } = payload;
   // ?? Check is this driver exists?:
   const driver = await Auth.findOne({
      _id: driverId,
      role: AuthRole.DRIVER,
   }).select("+passwordHash");

   if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found!");
   }

   if (driver?.status !== AuthStatus.ACTIVE) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Driver profile is not active yet.",
      );
   }

   // ?? Find out driver profile details:
   const profile = await Driver?.findOne({
      user: driver?._id,
   });

   if (!profile) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Driver profile details is not submitted yet.",
      );
   }

   if (profile.company?.toString() !== user?._id?.toString()) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "This driver is not belongs to your company",
      );
   }

   // ? Compare old password:
   const hashedPassword = await hashPassword(
      newPassword,
      configs.passwordSaltRound,
   );

   driver.passwordHash = hashedPassword;
   driver.passwordChangedAt = new Date();

   await driver.save({
      validateBeforeSave: true,
   });

   const html = driverPasswordChangedTemplate({
      driverName: driver.name,
      email: driver.email,
      password: newPassword,
      companyName: user?.name,
   });

   await sendEmail({
      to: driver.email,
      subject: "Ihr Passwort wurde geändert",
      html,
   });

   return null;
};

const updateStatus = async (
   user: IAuthDoc,
   driverId: string,
   payload: TUpdateStatusPayloadType,
) => {
   const { status } = payload;
   // ?? Check is this driver exists?:
   const driver = await Auth.findOne({
      _id: driverId,
      role: AuthRole.DRIVER,
   }).select("+passwordHash");

   if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found!");
   }

   // ?? Find out driver profile details:
   const profile = await Driver?.findOne({
      user: driver?._id,
   });

   if (!profile) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Driver profile details is not submitted yet.",
      );
   }

   if (profile.company?.toString() !== user?._id?.toString()) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "This driver is not belongs to your company",
      );
   }

   if (driver.status === status) {
      if (driver.status === status) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            `Driver is already ${status}.`,
         );
      }
   }

   driver.status = status;

   await driver.save();

   return null;
};

const deleteDriverById = async (user: IAuthDoc, driverId: string) => {
   // ?? Check is this driver exists?:
   const driver = await Auth.findOne({
      _id: driverId,
      role: AuthRole.DRIVER,
   });

   if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found!");
   }

   // ?? Find out driver profile details:
   const profile = await Driver?.findOne({
      user: driver?._id,
   });

   if (!profile) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Driver profile details is not submitted yet.",
      );
   }

   if (profile.company?.toString() !== user?._id?.toString()) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "This driver is not belongs to your company",
      );
   }

   /*
      Few validation we have to later: 
   */
   //   ?? check has any ongoing task which is not completed yet?:
   const assignment = await Booking.findOne({
      assignedDriver: driver?._id,
      bookingStatus: {
         $nin: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
      },
   });

   if (assignment) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "This is driver has an active assigned booking.",
      );
   }

   const session = await mongoose.startSession();

   try {
      session.startTransaction();
      const deletedDriver = await Auth.findOneAndDelete(
         {
            _id: driverId,
         },
         {
            new: true,
            session,
         },
      );

      if (!deletedDriver) {
         throw new AppError(httpStatus.BAD_REQUEST, "Failed to delete driver.");
      }

      const deletedProfile = await Driver.deleteOne(
         {
            user: deletedDriver?._id,
         },
         {
            session,
         },
      );

      if (!deletedProfile) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to delete driver profile details.",
         );
      }

      await session.commitTransaction();

      if (driver.profileImage) {
         await deleteFileByUrl(driver.profileImage);
      }

      return null;
   } catch (error: any) {
      await session.abortTransaction();
      throw new AppError(
         httpStatus.INTERNAL_SERVER_ERROR,
         error.message || "Something went wrong!",
      );
   } finally {
      await session.endSession();
   }
};

export const DriverServices = {
   createDriverIntoDB,
   getAllDrivers,
   setNewPassword,
   updateStatus,
   deleteDriverById,
};
