import httpStatus from "http-status";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { TrackingStateServices } from "./tracking-state.services";

const getByBookingId = catchAsync(async (req, res) => {
   const result = await TrackingStateServices.getByBookingId(req.params.bookingId as string);
   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Tracking state fetched successfully!",
      data: result,
   });
});

const startTracking = catchAsync(async (req, res) => {
   const result = await TrackingStateServices.startTracking(req.params.bookingId as string);
   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Tracking started successfully!",
      data: result,
   });
});

const pauseTracking = catchAsync(async (req, res) => {
   const result = await TrackingStateServices.pauseTracking(req.params.bookingId as string);
   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Tracking paused successfully!",
      data: result,
   });
});

const updateProgress = catchAsync(async (req, res) => {
   const { progress } = req.body;
   const result = await TrackingStateServices.updateProgress(req.params.bookingId as string, progress);
   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Tracking progress updated successfully!",
      data: result,
   });
});

const deleteTracking = catchAsync(async (req, res) => {
   const result = await TrackingStateServices.deleteTracking(req.params.bookingId as string);
   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Tracking state deleted successfully!",
      data: result,
   });
});

export const TrackingStateController = {
   getByBookingId,
   startTracking,
   pauseTracking,
   updateProgress,
   deleteTracking
};
