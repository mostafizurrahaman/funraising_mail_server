import httpStatus from "http-status";
import { catchAsync, sendResponse } from "@/app/utils";
import { BookingServices } from "./booking.services";
import type {
   TGkvBookingPayloadType,
   TPrivateBookingPayloadType,
} from "./booking.validation";
import type { TMulterFile } from "@/app/types/multer.types";

const createGkbBooking = catchAsync(async (req, res) => {
   console.log(req.files);
   const files = req.files as TMulterFile[];
   const payload = req.body as TGkvBookingPayloadType;

   const result = await BookingServices.createGkbBooking(payload, files);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Booking created successfully!",
      data: result,
   });
});

const createPrivateBooking = catchAsync(async (req, res) => {
   const payload = req.body as TPrivateBookingPayloadType;

   const result = await BookingServices.createPrivateBooking(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Booking created successfully!",
      data: result,
   });
});

export const BookingController = {
   createGkbBooking,
   createPrivateBooking,
};
