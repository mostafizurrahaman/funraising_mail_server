import httpStatus from "http-status";
import { catchAsync, getUserFromRequest, sendResponse } from "@/app/utils";
import { PricingServices } from "./pricing.services";

const updateAndCreatePricing = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const result = await PricingServices.updateAndCreatePricing(user, req.body);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Pricing setup for company successfully!",
      data: result,
   });
});

const getPricingForCompany = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const result = await PricingServices.getPricingForCompany(user);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Your company pricing retrieved successfully.",
      data: result,
   });
});

const getPublicPricingByCompanyId = catchAsync(async (req, res) => {
   const { companyId } = req.params;
   const result = await PricingServices.getPublicPricingByCompanyId(companyId as string);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Public pricing retrieved successfully.",
      data: result,
   });
});

export const PricingController = {
   updateAndCreatePricing,
   getPricingForCompany,
   getPublicPricingByCompanyId,
};
