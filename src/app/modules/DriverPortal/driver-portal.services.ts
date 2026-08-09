import { Booking } from "../Booking/booking.model";
import { Driver } from "../Driver/driver.model";
import httpStatus from "http-status";
import { AppError } from "@/app/errors";
import { BookingStatus } from "../Booking/booking.constant";

const getAvailableRides = async (driverUserId: string) => {
   const driver = await Driver.findOne({ user: driverUserId });
   if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found!");
   }

   const rides = await Booking.find({
      company: driver.company,
      assignedDriver: null,
      bookingStatus: BookingStatus.NEW,
   });
   
   return rides;
};

const getMyRides = async (driverUserId: string) => {
   const driver = await Driver.findOne({ user: driverUserId });
   if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found!");
   }

   const rides = await Booking.find({ assignedDriver: driver._id });
   
   return rides;
};

const acceptRide = async (driverUserId: string, bookingId: string) => {
   const driver = await Driver.findOne({ user: driverUserId });
   if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found!");
   }

   const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, assignedDriver: null },
      { assignedDriver: driver._id, bookingStatus: BookingStatus.ASSIGNED },
      { new: true }
   );

   if (!booking) {
      throw new AppError(httpStatus.BAD_REQUEST, "Booking not available or already assigned.");
   }

   return booking;
};

const releaseRide = async (driverUserId: string, bookingId: string) => {
   const driver = await Driver.findOne({ user: driverUserId });
   if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found!");
   }

   const booking = await Booking.findOneAndUpdate(
      { _id: bookingId, assignedDriver: driver._id },
      { assignedDriver: null, bookingStatus: BookingStatus.NEW },
      { new: true }
   );

   if (!booking) {
      throw new AppError(httpStatus.BAD_REQUEST, "Cannot release this booking.");
   }

   return booking;
};

export const DriverPortalServices = {
   getAvailableRides,
   getMyRides,
   acceptRide,
   releaseRide,
};
