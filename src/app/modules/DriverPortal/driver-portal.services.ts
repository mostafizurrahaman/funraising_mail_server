import { Booking } from "../Booking/booking.model";
import { Driver } from "../Driver/driver.model";
import httpStatus from "http-status";
import { AppError } from "../../errors";
import { BookingStatus } from "../Booking/booking.constant";
import { Auth } from "../Auth/auth.model";

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
      { new: true },
   );

   if (!booking) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Booking not available or already assigned.",
      );
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
      { new: true },
   );

   if (!booking) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Cannot release this booking.",
      );
   }

   return booking;
};

const getDriverOverview = async (driverUserId: string) => {
   const driver = await Auth.findById(driverUserId);
   if (!driver) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found!");
   }

   const driverProfile = await Driver.findOne({
      user: driver?._id,
   });

   if (!driverProfile) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found!");
   }

   const now = new Date();
   const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
   );
   const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

   const [myStats, availableCount, todayCount] = await Promise.all([
      Booking.aggregate([
         { $match: { assignedDriver: driver._id } },
         {
            $facet: {
               total: [{ $count: "count" }],
               assigned: [
                  { $match: { bookingStatus: BookingStatus.ASSIGNED } },
                  { $count: "count" },
               ],
               started: [
                  { $match: { bookingStatus: BookingStatus.IN_TRANSIT } },
                  { $count: "count" },
               ],
               completed: [
                  { $match: { bookingStatus: BookingStatus.COMPLETED } },
                  { $count: "count" },
               ],
               cancelled: [
                  { $match: { bookingStatus: BookingStatus.CANCELLED } },
                  { $count: "count" },
               ],
            },
         },
      ]),
      Booking.countDocuments({
         company: driverProfile.company,
         assignedDriver: null,
         bookingStatus: BookingStatus.NEW,
      }),
      Booking.countDocuments({
         assignedDriver: driver._id,
         rideAt: { $gte: startOfToday, $lt: endOfToday },
      }),
   ]);

   const pick = (arr: any[], key: string) => arr?.[0]?.[key]?.[0]?.count ?? 0;

   return {
      myRides: {
         total: pick(myStats, "total"),
         assigned: pick(myStats, "assigned"),
         started: pick(myStats, "started"),
         completed: pick(myStats, "completed"),
         cancelled: pick(myStats, "cancelled"),
      },
      availableRides: availableCount,
      todayRides: todayCount,
   };
};

export const DriverPortalServices = {
   getAvailableRides,
   getMyRides,
   acceptRide,
   releaseRide,
   getDriverOverview,
};
