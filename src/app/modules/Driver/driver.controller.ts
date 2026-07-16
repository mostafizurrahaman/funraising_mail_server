import httpStatus from "http-status";
import { catchAsync, sendResponse } from "@/app/utils";
import { DriverServices } from "./driver.services";

const create = catchAsync(async (req, res) => {
   const payload = req.body;

   await DriverServices.createIntoDB(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Driver created successfully!",
      data: null,
   });
});

export const DriverController = {
   create,
};
