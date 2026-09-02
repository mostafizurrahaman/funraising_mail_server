import { slugify } from "../../utils/slugify";
import type { IAuthDoc } from "../Auth/auth.interface";
import type {
   TCreateSurchargePayload,
   TUpdateSurchargePayload,
} from "./surcharge.validation";
import { Surcharge } from "./surcharge.model";
import { AppError } from "../../errors";
import httpStatus from "http-status";
import type { PipelineStage } from "mongoose";
import { getUserFromRequest } from "../../utils";
import { Auth } from "../Auth/auth.model";
import { GlobalSurcharge } from "../GlobalSurcharge/globalSurcharge.model";

const createSurchargeIntoDB = async (
   user: IAuthDoc,
   payload: TCreateSurchargePayload,
) => {
   const { label, amount } = payload;

   // ? slugify the slug:
   const slug = slugify(label);

   // Verify the global surcharge exists
   const globalSurcharge = await GlobalSurcharge.findOne({ labelSlug: slug });
   if (!globalSurcharge) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Invalid surcharge label. It must be an Admin-defined charge module.",
      );
   }

   // ? Check surcharge already exists with this slug:
   const existingSurcharge = await Surcharge.findOne({
      globalSurcharge: globalSurcharge._id,
      user: user?._id,
   });

   if (existingSurcharge) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Already have a surcharge with this label!",
      );
   }

   // ? Create charge :
   const surcharge = await Surcharge.create({
      user: user?._id,
      globalSurcharge: globalSurcharge._id,
      amount,
   });

   return surcharge;
};

const updateSurchargeIntoDBById = async (
   user: IAuthDoc,
   id: string,
   payload: TUpdateSurchargePayload,
) => {
   // ? Check surcharge already exists with this slug:
   const existingSurcharge = await Surcharge.findOne({
      _id: id,
      user: user?._id,
   });

   if (!existingSurcharge) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Surcharge not found  with this ID for your company.",
      );
   }

   // The company is only allowed to update the numeric amount.
   // We ignore any attempt to update the label.
   if (payload.amount !== undefined) existingSurcharge.amount = payload.amount;

   existingSurcharge.save({
      validateBeforeSave: true,
   });

   return existingSurcharge;
};

const deleteSurchargeByIDFromDB = async (user: IAuthDoc, id: string) => {
   // ? Check surcharge already exists with this slug:
   const existingSurcharge = await Surcharge.findOne({
      _id: id,
      user: user?._id,
   });

   if (!existingSurcharge) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Surcharge not found  with this ID for your company.",
      );
   }

   // ?  delete the surcharge from database :
   const deletedSurcharge = await Surcharge.findOneAndDelete({
      _id: id,
      user: user?._id,
   });

   return deletedSurcharge;
};

const getAllSurchargeFromDB = async (companyId: string) => {
   // ?? Check is there any  company exists with this ID:
   const user = await Auth.findOne({
      _id: companyId,
   });

   if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "Company not found!");
   }

   const pipeline: PipelineStage[] = [
      {
         $match: {
            user: user?._id,
         },
      },
      {
         $lookup: {
            from: "globalsurcharges",
            localField: "globalSurcharge",
            foreignField: "_id",
            as: "globalSurchargeDoc",
         },
      },
      {
         $unwind: {
            path: "$globalSurchargeDoc",
            preserveNullAndEmptyArrays: true,
         },
      },
      {
         $addFields: {
            label: "$globalSurchargeDoc.label",
            labelSlug: "$globalSurchargeDoc.labelSlug",
         },
      },
      {
         $project: {
            globalSurchargeDoc: 0,
         },
      },
   ];

   const allSurcharges = await Surcharge.aggregate(pipeline);

   return allSurcharges;
};

export const SurchargeServices = {
   createSurchargeIntoDB,
   updateSurchargeIntoDBById,
   deleteSurchargeByIDFromDB,
   getAllSurchargeFromDB,
};
