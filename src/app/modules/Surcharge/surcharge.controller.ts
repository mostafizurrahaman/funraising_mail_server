import httpStatus from "http-status";
import { catchAsync, sendResponse } from "@/app/utils";
import { SurchargeServices } from "./surcharge.services";

const create = catchAsync(async (req, res) => {
   const payload = req.body;

   await SurchargeServices.createIntoDB(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Surcharge created successfully!",
      data: null,
   });
});

export const SurchargeController = {
   create,
};
