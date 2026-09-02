import moment from "moment";
import httpStatus from "http-status";
import { customAlphabet } from "nanoid";

import { AppError } from "../../errors";
import { Booking } from "./booking.model";

const nano = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 8);

/**
 * Generates a booking number.
 * Example: KF-20260724-8K4M2P7Q
 */
export const generateBookingNumber = (): string => {
   const now = new Date();

   const year = now.getFullYear();
   const month = String(now.getMonth() + 1).padStart(2, "0");
   const day = String(now.getDate()).padStart(2, "0");

   return `KF-${year}${month}${day}-${nano()}`;
};

/**
 * Generates a unique booking number by checking the database.
 */
export const generateUniqueBookingNumber = async (): Promise<string> => {
   const maxAttempts = 15;

   for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const bookingNumber = generateBookingNumber();

      const exists = await Booking.exists({ bookingNumber });

      if (!exists) {
         return bookingNumber;
      }
   }

   throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Unable to generate a unique booking number. Please try again.",
   );
};

//  Haversine formula KM distance calculation (highly precise)
export const calculateDistance = (
   lon1: number,
   lat1: number,
   lon2: number,
   lat2: number,
): number => {
   if (lon1 === lon2 && lat1 === lat2) return 0;
   const R = 6371; // Earth radius
   const dLat = ((lat2 - lat1) * Math.PI) / 180;
   const dLon = ((lon2 - lon1) * Math.PI) / 180;
   const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
         Math.cos((lat2 * Math.PI) / 180) *
         Math.sin(dLon / 2) *
         Math.sin(dLon / 2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   const dist = R * c;
   return Math.round(dist * 10) / 10; // Round to 1 decimal place
};

// ** Ride date time *

export const prepareRideDateTime = (rideDate: string, desiredArrivalTime: string) => {
   // Combine date and 24-hour time
   const rideAtMoment = moment(`${rideDate} ${desiredArrivalTime}`, "YYYY-MM-DD HH:mm");

   if (!rideAtMoment.isValid()) {
      throw new Error("Invalid ride date or ride time");
   }

   return {
      rideDate: rideAtMoment.clone().startOf("day").toDate(),
      desiredArrivalTime,
      rideAt: rideAtMoment.toDate(),
   };
};

export const calculatePickupTime = (arrivalTime: string, tripDurationMinutes: number): string => {
   const arrivalMoment = moment(arrivalTime, "HH:mm");
   if (!arrivalMoment.isValid()) {
      return arrivalTime;
   }
   // Subtract duration + 15 mins buffer
   arrivalMoment.subtract(tripDurationMinutes + 15, "minutes");
   return arrivalMoment.format("HH:mm");
};
