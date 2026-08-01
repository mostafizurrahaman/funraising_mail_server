import { AppError } from "@/app/errors";
import type { IAuthDoc } from "../Auth/auth.interface";
import { Pricing } from "./pricing.model";
import type { TUpdateOrCreatePayload } from "./pricing.validation";
import httpStatus from "http-status";

// ** create and update base fare:
const updateAndCreatePricing = async (
   user: IAuthDoc,
   payload: TUpdateOrCreatePayload,
) => {
   const existingPricing = await Pricing.findOne({
      user: user._id,
   });

   if (existingPricing) {
      existingPricing.baseFare = payload.baseFare || existingPricing.baseFare;
      existingPricing.perKm = payload.perKm || existingPricing.perKm;

      await existingPricing.save();

      return existingPricing;
   }

   const pricing = await Pricing.create({
      user: user._id,
      ...payload,
   });

   return pricing;
};

// ** Get base for this company:

const getPricingForCompany = async (user: IAuthDoc) => {
   const existingPricing = await Pricing.findOne({
      user: user._id,
   });

   if (!existingPricing) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Please setup pricing for you company!",
      );
   }

   return existingPricing;
};

export const PricingServices = {
   updateAndCreatePricing,
   getPricingForCompany,
};
