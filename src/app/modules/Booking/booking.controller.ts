import httpStatus from "http-status";
import { catchAsync, sendResponse } from "@/app/utils";
import { BookingServices } from "./booking.services";

const create = catchAsync(async (req, res) => {
   const payload = req.body;

   await BookingServices.createIntoDB(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Booking created successfully!",
      data: null,
   });
});

export const BookingController = {
   create,
};
