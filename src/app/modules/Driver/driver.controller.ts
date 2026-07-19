import httpStatus from "http-status";
import { catchAsync, getUserFromRequest, sendResponse } from "@/app/utils";
import { DriverServices } from "./driver.services";
import type { TMulterFile } from "@/app/types/multer.types";

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

export const DriverController = {
   createDriver,
};
