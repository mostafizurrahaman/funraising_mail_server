import { Auth } from "../Auth/auth.model";

import type { PipelineStage } from "mongoose";
import type {
   TGetAllUserQueryType,
   TUpdateUserStatusPayloadType,
} from "./user.validations";
import { AuthPermission, AuthRole } from "../Auth/auth.constant";
import type { IAuthDoc } from "../Auth/auth.interface";
import httpStatus from "http-status";
import { AppError } from "@/app/errors";
const getAllUserFromDB = async (query: TGetAllUserQueryType) => {
   const {
      page: currentPage = 1,
      limit: currentLimit = 10,
      status,
      role,
      fromDate,
      toDate,
      searchTerm,
      sortBy = "createdAt",
      sortOrder = "asc",
   } = query;

   const page = Math.max(Number(currentPage), 1);
   const limit = Number(currentLimit);
   const skip = (page - 1) * limit;

   const pipeline: PipelineStage[] = [];

   if (status) {
      pipeline.push({
         $match: {
            status,
         },
      });
   }

   if (role) {
      pipeline.push({
         $match: {
            role,
         },
      });
   }

   // ?? from date and to Date :
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

   pipeline.push({
      $lookup: {
         from: "companies",
         localField: "_id",
         foreignField: "user",
         as: "companyDetails",
      },
   });
   pipeline.push({
      $lookup: {
         from: "drivers",
         localField: "_id",
         foreignField: "user",
         as: "driverDetails",
      },
   });

   pipeline.push({
      $unwind: {
         path: "$companyDetails",
         preserveNullAndEmptyArrays: true,
      },
   });
   pipeline.push({
      $unwind: {
         path: "$driverDetails",
         preserveNullAndEmptyArrays: true,
      },
   });

   pipeline.push({
      $addFields: {
         companyProfileID: {
            $cond: [
               { $eq: ["$role", AuthRole.COMPANY] },
               "$companyDetails._id",
               "$$REMOVE",
            ],
         },
         companyCode: {
            $cond: [
               { $eq: ["$role", AuthRole.COMPANY] },
               "$companyDetails.companyCode",
               "$$REMOVE",
            ],
         },
         companyName: {
            $cond: [
               { $eq: ["$role", AuthRole.COMPANY] },
               "$companyDetails.companyName",
               "$$REMOVE",
            ],
         },
         city: {
            $cond: [
               { $eq: ["$role", AuthRole.COMPANY] },
               "$companyDetails.city",
               "$$REMOVE",
            ],
         },
         address: {
            $cond: [
               { $eq: ["$role", AuthRole.COMPANY] },
               "$companyDetails.address",
               "$$REMOVE",
            ],
         },
         serviceArea: {
            $cond: [
               { $eq: ["$role", AuthRole.COMPANY] },
               "$companyDetails.serviceArea",
               "$$REMOVE",
            ],
         },
         radiusKm: {
            $cond: [
               { $eq: ["$role", AuthRole.COMPANY] },
               "$companyDetails.radiusKm",
               "$$REMOVE",
            ],
         },
         note: {
            $cond: [
               { $eq: ["$role", AuthRole.COMPANY] },
               "$companyDetails.note",
               "$$REMOVE",
            ],
         },
         vehicleDetails: {
            $cond: [
               { $eq: ["$role", AuthRole.DRIVER] },
               "$driverDetails.vehicleDetails",
               "$$REMOVE",
            ],
         },
         driverCompany: {
            $cond: [
               { $eq: ["$role", AuthRole.DRIVER] },
               "$driverDetails.company",
               "$$REMOVE",
            ],
         },
         driverProfileId: {
            $cond: [
               { $eq: ["$role", AuthRole.DRIVER] },
               "$driverDetails._id",
               "$$REMOVE",
            ],
         },
      },
   });

   pipeline.push({
      $lookup: {
         from: "auths",
         let: {
            driverCompany: "$driverCompany",
         },
         pipeline: [
            {
               $match: {
                  $expr: {
                     $eq: ["$_id", "$$driverCompany"],
                  },
               },
            },
            {
               $lookup: {
                  from: "companies",
                  let: {
                     userId: "$_id",
                  },
                  pipeline: [
                     {
                        $match: {
                           $expr: {
                              $eq: ["$user", "$$userId"],
                           },
                        },
                     },
                     {
                        $project: {
                           companyId: "$_id",
                           comanpyUser: "$user",
                           companyCode: "$companyCode",
                           companyName: "$companyName",
                        },
                     },
                  ],
                  as: "companyDetails",
               },
            },
            {
               $unwind: {
                  path: "$companyDetails",
                  preserveNullAndEmptyArrays: true,
               },
            },
            {
               $project: {
                  companyUserId: "$_id",
                  companyProfileId: "$companyDetails._id",
                  companyUserName: "$name",
                  companyPhone: "$phone",
                  companyEmail: "$email",
                  companyProfileImage: "$profileImage",
                  companyProfileName: "$companyDetails.companyName",
                  companyCode: "$companyDetails.companyCode",
               },
            },
         ],
         as: "driverCompanyUserDetails",
      },
   });

   pipeline.push({
      $unwind: {
         path: "$driverCompanyUserDetails",
         preserveNullAndEmptyArrays: true,
      },
   });

   pipeline.push({
      $project: {
         companyDetails: 0,
         driverDetails: 0,
         passwordHash: 0,
         driverCompany: 0,
      },
   });

   const searchableFeilds = [
      "companyCode",
      "companyName",
      "phone",
      "name",
      "email",
   ];

   if (searchTerm) {
      pipeline.push({
         $match: {
            $or: searchableFeilds.map((field) => ({
               [field]: { $regex: searchTerm, $options: "i" },
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

const updateStatus = async (
   user: IAuthDoc,
   userId: string,
   payload: TUpdateUserStatusPayloadType,
) => {
   const { status } = payload;
   // ?? Check is this driver exists?:
   const existingUser = await Auth.findOne({
      _id: userId,
   });

   if (!existingUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found  wit this ID!");
   }

   if (existingUser?._id?.toString() === user?._id?.toString()) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "You can not change your own account status!",
      );
   }

   if (AuthPermission[existingUser.role] >= AuthPermission[user.role]) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "You don't have permission to change this user status.",
      );
   }

   if (existingUser.status === status) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         `User account is already ${status}.`,
      );
   }

   existingUser.status = status;

   await existingUser.save();

   return {
      _id: existingUser._id,
      name: existingUser.name,
      phone: existingUser.phone,
      email: existingUser.email,
      status: existingUser.status,
   };
};
export const UserServices = {
   getAllUserFromDB,
   updateStatus,
};
