import type { TMulterFile } from "@/app/types/multer.types";
import { Auth } from "../Auth/auth.model";
import type {
   TGkvBookingPayloadType,
   TPrivateBookingPayloadType,
} from "./booking.validation";
import { AppError } from "@/app/errors";
import httpStatus from "http-status";
import { AuthStatus } from "../Auth/auth.constant";
import { Driver } from "../Driver";
import {
   calculateDistance,
   generateUniqueBookingNumber,
   prepareRideDateTime,
} from "./booking.utils";
import { uploadMultipleFilesIntoCloudinary } from "@/app/utils/upload-file-into-cloudinary";
import { GkvBooking, PrivateBooking } from "./booking.model";
import {
   BookingPaymentStatus,
   BookingStatus,
   BookingType,
} from "./booking.constant";
import { Pricing } from "../Pricing";
import { Surcharge, type ISurcharge, type ISurchargeDoc } from "../Surcharge";

import mongoose from "mongoose";
import type { IPrivateBookingDoc } from "./booking.interface";

const createGkbBooking = async (
   payload: TGkvBookingPayloadType,
   prescriptionFiles: TMulterFile[],
) => {
   console.log(prescriptionFiles);
   const {
      patientName,
      phone,
      pickupAddress,
      pickupLongitude,
      pickupLatitude,
      destinationAddress,
      destinationLongitude,
      destinationLatitude,
      rideDate,
      rideTime,
      insuranceName,
      insuranceNumber,
      vehicleType,
      prescriptionReason,
      notes,
      companyId,
   } = payload;

   // ?? Check  is company exists :
   const company = await Auth.findOne({
      _id: companyId,
   });

   if (!company) {
      throw new AppError(httpStatus.NOT_FOUND, "Company  not found!");
   }

   if (company.status !== AuthStatus.ACTIVE) {
      throw new AppError(httpStatus.BAD_REQUEST, "This company is not active!");
   }

   // ?? Check  this company has any driver ?:
   const drivers = await Driver.find({
      company: company?._id,
   });

   if (drivers.length < 1) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Sorry. This company has no drivers.",
      );
   }
   // ?? Ride Date and time
   const {
      rideDate: rdDate,
      rideTime: rdTime,
      rideAt,
   } = prepareRideDateTime(rideDate, rideTime);

   if (rideAt.getTime() < new Date().getTime()) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Ride date should not be previous  date.",
      );
   }

   // ?? Calculate distance (km)
   const distance = calculateDistance(
      pickupLongitude,
      pickupLatitude,
      destinationLongitude,
      destinationLatitude,
   );

   if (distance <= 0) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Distance should not be 0 Km.",
      );
   }

   // Estimated Time
   const estTime = Math.max(5, Math.round((distance / 32) * 60));

   // ?? Generate Booking Number:
   const bookingNumber = await generateUniqueBookingNumber();

   // ?? Upload Files If Prescription  provided:
   let fileUrls: string[] = [];
   if (prescriptionFiles?.length > 0) {
      const files = await uploadMultipleFilesIntoCloudinary(
         prescriptionFiles,
         "prescriptions",
      );

      if (files?.length > 0) fileUrls = files;
   }

   // ??
   console.log(fileUrls);

   const gkvBooking = await GkvBooking.create({
      bookingNumber,
      company: company?._id,
      patientName,
      phone,
      bookingType: BookingType.GKV,

      // Pickup Address:
      pickupAddress,
      pickupLocation: {
         type: "Point",
         coordinates: [pickupLongitude, pickupLatitude],
      },

      // Destination Address:
      destinationAddress,
      destinationLocation: {
         type: "Point",
         coordinates: [destinationLongitude, destinationLatitude],
      },

      // Date and time:
      rideDate: rdDate,
      rideTime: rdTime,
      rideAt: rideAt,

      // Estimation and calculation :
      estimatedDistance: distance,
      estimatedRidingTime: estTime,

      platformFee: 2, // 2 eur
      invoiceUrl: "",
      notes,
      bookingStatus: BookingStatus.NEW,

      // GKB RELATED FIELDS :
      insuranceName,
      insuranceNumber,
      vehicleType,
      prescriptionReason,
      prescriptionAttached: fileUrls?.length > 0,
      prescriptionFiles: fileUrls,
   });

   return gkvBooking;
};

const createPrivateBooking = async (payload: TPrivateBookingPayloadType) => {
   const {
      patientName,
      phone,
      pickupAddress,
      pickupLongitude,
      pickupLatitude,
      destinationAddress,
      destinationLongitude,
      destinationLatitude,
      rideDate,
      rideTime,
      notes,
      companyId,

      // Private booking related fields:
      bookingCharges,
   } = payload;

   // ?? Check  is company exists :
   const company = await Auth.findOne({
      _id: companyId,
   });

   if (!company) {
      throw new AppError(httpStatus.NOT_FOUND, "Company  not found!");
   }

   if (company.status !== AuthStatus.ACTIVE) {
      throw new AppError(httpStatus.BAD_REQUEST, "This company is not active!");
   }

   // ?? Check  this company has any driver ?:
   const drivers = await Driver.find({
      company: company?._id,
   });

   if (drivers.length < 1) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Sorry. This company has no drivers.",
      );
   }

   // ?? Retrieved the pricing for the company:
   const basePricing = await Pricing.findOne({
      user: company?._id,
   });

   if (!basePricing || !basePricing.baseFare || !basePricing.perKm) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Pricing for this company not setup yet.",
      );
   }

   // ?? Selected surcharge:
   const surcharges: ISurchargeDoc[] = [];
   if (
      bookingCharges &&
      Array.isArray(bookingCharges) &&
      bookingCharges?.length > 0
   ) {
      const companySurcharges = await Surcharge.find({
         _id: {
            $in: bookingCharges,
         },
      });

      if (companySurcharges?.length < bookingCharges.length) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Invalid booking options selected.",
         );
      }

      surcharges.push(...companySurcharges);
   }

   const surchargeIds = surcharges?.map((item) => item._id);
   const snapShot = surcharges.map((item) => ({
      label: item.label,
      amount: item.amount,
   }));

   // ?? Ride Date and time
   const {
      rideDate: rdDate,
      rideTime: rdTime,
      rideAt,
   } = prepareRideDateTime(rideDate, rideTime);

   if (rideAt.getTime() < new Date().getTime()) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Ride date should not be previous  date.",
      );
   }

   // ?? Calculate distance (km)
   const distance = calculateDistance(
      pickupLongitude,
      pickupLatitude,
      destinationLongitude,
      destinationLatitude,
   );

   if (distance <= 0) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Distance should not be 0 Km.",
      );
   }

   // Estimated Time
   const estTime = Math.max(5, Math.round((distance / 32) * 60));

   // ?? Generate Booking Number:
   const bookingNumber = await generateUniqueBookingNumber();

   // ?? Base Pricing :
   const distancePricePerKm = Number(basePricing.perKm) * distance;

   const additionalSurcharge = surcharges.reduce(
      (acc: number, surcharge: ISurcharge) => {
         acc = acc + Math.max(surcharge.amount, 0);
         return acc;
      },
      0,
   );

   const estimatedFixedPrice = Number(
      Math.max(
         Number(basePricing.baseFare) +
            distancePricePerKm +
            additionalSurcharge,
         0,
      ).toFixed(2),
   );

   const privateBooking = await PrivateBooking.create({
      bookingNumber,
      company: company?._id,
      patientName,
      phone,
      bookingType: BookingType.PRIVATE,

      // Pickup Address:
      pickupAddress,
      pickupLocation: {
         type: "Point",
         coordinates: [pickupLongitude, pickupLatitude],
      },

      // Destination Address:
      destinationAddress,
      destinationLocation: {
         type: "Point",
         coordinates: [destinationLongitude, destinationLatitude],
      },

      // Date and time:
      rideDate: rdDate,
      rideTime: rdTime,
      rideAt: rideAt,

      // Estimation and calculation :
      estimatedDistance: distance,
      estimatedRidingTime: estTime,

      platformFee: 2, // 2 eur
      invoiceUrl: "",
      notes: notes as string,
      bookingStatus: BookingStatus.NEW,

      // Private RELATED FIELDS :
      basePrice: Math.max(Number(basePricing.baseFare), 0),
      pricePerKm: Math.max(Number(basePricing.perKm), 0),
      bookingCharges: surchargeIds,
      bookingChargeSnapshot: JSON.stringify(snapShot),
      estimatedFixedPrice,
      paymentStatus: BookingPaymentStatus.PENDING,
   });

   return privateBooking;
};

export const BookingServices = {
   createGkbBooking,
   createPrivateBooking,
};
