import httpStatus from "http-status";
import { AppError } from "../../errors";
import { SupportMessage } from "./support.model";
import type { ISupportMessage, SupportStatus } from "./support.interface";

// Sequential status change chain: new -> in_progress -> resolved
export const SUPPORT_STATUS_CHAIN: Record<SupportStatus, SupportStatus[]> = {
   new: ["in_progress"],
   in_progress: ["resolved"],
   resolved: [],
};

const createSupportMessage = async (
   payload: Omit<ISupportMessage, "status" | "adminNote">,
) => {
   const result = await SupportMessage.create(payload);
   return result;
};

const getAllSupportMessages = async (query?: {
   status?: string;
   searchTerm?: string;
   page?: number | string;
   limit?: number | string;
   sortBy?: string;
   sortOrder?: string;
}) => {
   const page = Math.max(Number(query?.page) || 1, 1);
   const limit = Math.max(Number(query?.limit) || 10, 1);
   const skip = (page - 1) * limit;

   const allowedSortFields = ["createdAt", "name", "email", "subject", "status"];
   const sortBy =
      query?.sortBy && allowedSortFields.includes(query.sortBy)
         ? query.sortBy
         : "createdAt";
   const sortOrder = query?.sortOrder === "asc" ? 1 : -1;

   const filter: Record<string, any> = {};

   if (query?.status && query.status !== "all") {
      filter.status = query.status;
   }

   if (query?.searchTerm) {
      filter.$or = [
         { name: { $regex: query.searchTerm, $options: "i" } },
         { email: { $regex: query.searchTerm, $options: "i" } },
         { subject: { $regex: query.searchTerm, $options: "i" } },
         { message: { $regex: query.searchTerm, $options: "i" } },
      ];
   }

   const [data, total] = await Promise.all([
      SupportMessage.find(filter)
         .sort({ [sortBy]: sortOrder })
         .skip(skip)
         .limit(limit),
      SupportMessage.countDocuments(filter),
   ]);

   const totalPages = Math.ceil(total / limit) || 1;

   return {
      data,
      meta: {
         total,
         page,
         limit,
         totalPages,
      },
   };
};

const updateSupportMessage = async (
   id: string,
   payload: Partial<Pick<ISupportMessage, "status" | "adminNote">>,
) => {
   const existing = await SupportMessage.findById(id);
   if (!existing) {
      throw new AppError(httpStatus.NOT_FOUND, "Support message not found!");
   }

   if (payload.status) {
      const currentStatus = existing.status;

      if (currentStatus === "resolved") {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Resolved support messages cannot be changed further.",
         );
      }

      if (payload.status === currentStatus) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            `Support message is already in '${currentStatus}' status.`,
         );
      }

      const allowedNext = SUPPORT_STATUS_CHAIN[currentStatus] || [];
      if (!allowedNext.includes(payload.status)) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            `Invalid status transition from '${currentStatus}' to '${payload.status}'. Allowed next status: ${allowedNext.join(", ") || "none"}.`,
         );
      }
   }

   const result = await SupportMessage.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
   });

   return result;
};

const deleteSupportMessage = async (id: string) => {
   const result = await SupportMessage.findByIdAndDelete(id);
   if (!result) {
      throw new AppError(httpStatus.NOT_FOUND, "Support message not found!");
   }
   return result;
};

export const SupportServices = {
   createSupportMessage,
   getAllSupportMessages,
   updateSupportMessage,
   deleteSupportMessage,
};
