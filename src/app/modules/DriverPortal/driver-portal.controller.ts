import httpStatus from "http-status";
import { catchAsync } from "@/app/utils/catch-async";
import { sendResponse } from "@/app/utils/send-response";
import { DriverPortalServices } from "./driver-portal.services";
import { getUserFromRequest } from "@/app/utils";

const getAvailableRides = catchAsync(async (req, res) => {
   const result = await DriverPortalServices.getAvailableRides(
      String(req.user._id),
   );

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Available rides fetched successfully!",
      data: result,
   });
});

const getMyRides = catchAsync(async (req, res) => {
   const result = await DriverPortalServices.getMyRides(String(req.user._id));

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My rides fetched successfully!",
      data: result,
   });
});

const acceptRide = catchAsync(async (req, res) => {
   const result = await DriverPortalServices.acceptRide(
      String(req.user._id),
      req.params.id as string,
   );

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Ride accepted successfully!",
      data: result,
   });
});

const releaseRide = catchAsync(async (req, res) => {
   const result = await DriverPortalServices.releaseRide(
      String(req.user._id),
      req.params.id as string,
   );

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Ride released successfully!",
      data: result,
   });
});

const getDriverOverview = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const result = await DriverPortalServices.getDriverOverview(
      user?._id?.toString(),
   );

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Driver overview fetched successfully!",
      data: result,
   });
});

export const DriverPortalController = {
   getAvailableRides,
   getMyRides,
   acceptRide,
   releaseRide,
   getDriverOverview,
};
