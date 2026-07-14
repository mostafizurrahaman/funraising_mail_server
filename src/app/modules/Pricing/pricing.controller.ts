import httpStatus from "http-status";
import { catchAsync, sendResponse } from "@/app/utils";
import { PricingServices } from "./pricing.services";

const create = catchAsync(async (req, res) => {
   const payload = req.body;

   await PricingServices.createIntoDB(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Pricing created successfully!",
      data: null,
   });
});

export const PricingController = {
   create,
};
