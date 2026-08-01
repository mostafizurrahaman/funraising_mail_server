import httpStatus from "http-status";
import { catchAsync, sendResponse } from "@/app/utils";
import { TrackingStateServices } from "./tracking-state.services";

const create = catchAsync(async (req, res) => {
   const payload = req.body;

   await TrackingStateServices.createIntoDB(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "TrackingState created successfully!",
      data: null,
   });
});

export const TrackingStateController = {
   create,
};
