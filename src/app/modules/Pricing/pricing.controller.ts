import httpStatus from "http-status";
import { catchAsync, getUserFromRequest, sendResponse } from "../../utils";
import { PricingServices } from "./pricing.services";

const updateAndCreatePricing = catchAsync(async (req, res) => {
   const result = await PricingServices.updateAndCreatePricing(req.body);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Global pricing setup successfully!",
      data: result,
   });
});

const getPricingForCompany = catchAsync(async (req, res) => {
   const result = await PricingServices.getPricingForCompany();

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Global pricing retrieved successfully.",
      data: result,
   });
});

const getPublicPricingByCompanyId = catchAsync(async (req, res) => {
   const result = await PricingServices.getPublicPricingByCompanyId();

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
