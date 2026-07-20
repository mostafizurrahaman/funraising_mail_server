import httpStatus from "http-status";
import { catchAsync, getUserFromRequest, sendResponse } from "@/app/utils";
import { DriverServices } from "./driver.services";
import type { TMulterFile } from "@/app/types/multer.types";
import type { TGetAllDriverQuery } from "./driver.validation";

const createDriver = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const payload = req.body;
   const profileImage = req.file as TMulterFile;

   const result = await DriverServices.createDriverIntoDB(
      user,
      payload,
      profileImage,
   );

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Driver created successfully!",
      data: result,
   });
});

const getAllDrivers = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);

   const query = req.query as unknown as TGetAllDriverQuery;

   const result = await DriverServices.getAllDrivers(user, query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All Drivers retrieved successfully",
      data: result.data,
      meta: result.meta,
   });
});

const setNewPassword = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const driverId = req.params.driverId as string;

   const result = await DriverServices.setNewPassword(user, driverId, req.body);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Driver password updated successfully.",
      data: result,
   });
});

export const DriverController = {
   createDriver,
   getAllDrivers,
   setNewPassword,
};
