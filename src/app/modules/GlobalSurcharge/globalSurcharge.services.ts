import { slugify } from "../../utils/slugify";
import type {
   TCreateGlobalSurchargePayload,
   TUpdateGlobalSurchargePayload,
} from "./globalSurcharge.validation";
import { GlobalSurcharge } from "./globalSurcharge.model";
import { AppError } from "../../errors";
import httpStatus from "http-status";
import { Surcharge } from "../Surcharge/surcharge.model";

const createGlobalSurcharge = async (payload: TCreateGlobalSurchargePayload) => {
   const { label } = payload;
   const slug = slugify(label);

   const existing = await GlobalSurcharge.findOne({ labelSlug: slug });
   if (existing) {
      throw new AppError(httpStatus.CONFLICT, "A global surcharge with this label already exists.");
   }

   const surcharge = await GlobalSurcharge.create({ label, labelSlug: slug });
   return surcharge;
};

const updateGlobalSurchargeById = async (id: string, payload: TUpdateGlobalSurchargePayload) => {
   const { label } = payload;
   const updateData: any = {};
   
   if (label) {
      updateData.label = label;
      updateData.labelSlug = slugify(label);
      
      const existing = await GlobalSurcharge.findOne({ labelSlug: updateData.labelSlug, _id: { $ne: id } });
      if (existing) {
         throw new AppError(httpStatus.CONFLICT, "A global surcharge with this label already exists.");
      }
   }

   const surcharge = await GlobalSurcharge.findByIdAndUpdate(id, updateData, { new: true });
   if (!surcharge) {
      throw new AppError(httpStatus.NOT_FOUND, "Global surcharge not found.");
   }
   return surcharge;
};

const getAllGlobalSurcharges = async () => {
   return await GlobalSurcharge.find({}).sort({ createdAt: -1 });
};

const deleteGlobalSurchargeById = async (id: string) => {
   const surcharge = await GlobalSurcharge.findByIdAndDelete(id);
   if (!surcharge) {
      throw new AppError(httpStatus.NOT_FOUND, "Global surcharge not found.");
   }

   // Delete all associated Surcharges
   await Surcharge.deleteMany({ globalSurcharge: id });

   return surcharge;
};

export const GlobalSurchargeServices = {
   createGlobalSurcharge,
   updateGlobalSurchargeById,
   getAllGlobalSurcharges,
   deleteGlobalSurchargeById,
};
