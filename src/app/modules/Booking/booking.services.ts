import type { TMulterFile } from "@/app/types/multer.types";
import { Auth } from "../Auth/auth.model";
import type { TGkvBookingPayloadType } from "./booking.validation";
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
import { GkvBooking } from "./booking.model";
import { BookingStatus, BookingType } from "./booking.constant";

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

export const BookingServices = {
   createGkbBooking,
};
