import httpStatus from "http-status";
import { catchAsync, getUserFromRequest, sendResponse } from "@/app/utils";
import { BookingServices } from "./booking.services";
import type {
   TGetAllBookingQuery,
   TGkvBookingPayloadType,
   TPrivateBookingPayloadType,
   TVerifyPayment,
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
const getAllBookings = catchAsync(async (req, res) => {
   const result = await BookingServices.getBookingsFromDB(
      req.query as unknown as TGetAllBookingQuery,
   );

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Bookings are retrieved successfully!",
      meta: result.meta,
      data: result.data,
   });
});

const payForBookingByID = catchAsync(async (req, res) => {
   const bookingId = req.params.id as string;
   const result = await BookingServices.payForBookingByID(bookingId, req.body);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Booking payment submitted successfully.",
      data: result,
   });
});
const verifyPayment = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const bookingId = req.params.id as string;
   const { referenceNumber } = req.body as TVerifyPayment;
   const result = await BookingServices.verifyPayment(
      user,
      bookingId,
      referenceNumber,
   );

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment verified successfully.",
      data: result,
   });
});

export const BookingController = {
   createGkbBooking,
   createPrivateBooking,
   getAllBookings,
   payForBookingByID,
   verifyPayment,
};
