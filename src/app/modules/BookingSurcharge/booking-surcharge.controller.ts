import httpStatus from "http-status";
import { catchAsync, sendResponse } from "@/app/utils";
import { BookingSurchargeServices } from "./booking-surcharge.services";

const create = catchAsync(async (req, res) => {
   const payload = req.body;

   await BookingSurchargeServices.createIntoDB(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "BookingSurcharge created successfully!",
      data: null,
   });
});

export const BookingSurchargeController = {
   create,
};
