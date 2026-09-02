import { AppError } from "../../errors";
import type { IAuthDoc } from "../Auth/auth.interface";
import { Pricing } from "./pricing.model";
import type { TUpdateOrCreatePayload } from "./pricing.validation";
import httpStatus from "http-status";

// ** create and update base fare:
const updateAndCreatePricing = async (
   payload: TUpdateOrCreatePayload,
) => {
   const existingPricing = await Pricing.findOne();

   if (existingPricing) {
      existingPricing.baseFare = payload.baseFare ?? existingPricing.baseFare;
      existingPricing.perKm = payload.perKm ?? existingPricing.perKm;

      await existingPricing.save();

      return existingPricing;
   }

   const pricing = await Pricing.create(payload);

   return pricing;
};

// ** Get base for this company:

const getPricingForCompany = async () => {
   const existingPricing = await Pricing.findOne();

   if (!existingPricing) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Pricing has not been setup yet!",
      );
   }

   return existingPricing;
};

const getPublicPricingByCompanyId = async () => {
   const existingPricing = await Pricing.findOne().select("baseFare perKm -_id");

   if (!existingPricing) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Pricing not found.",
      );
   }

   return existingPricing;
};

export const PricingServices = {
   updateAndCreatePricing,
   getPricingForCompany,
   getPublicPricingByCompanyId,
};
