import type { TMulterFile } from "@/app/types/multer.types";
import { Auth } from "../Auth/auth.model";
import type {
   TGetAllBookingQuery,
   TGkvBookingPayloadType,
   TPayForBookingByID,
   TPrivateBookingPayloadType,
} from "./booking.validation";
import { AppError } from "@/app/errors";
import httpStatus from "http-status";
import { AuthRole, AuthStatus } from "../Auth/auth.constant";
import { Driver } from "../Driver";
import {
   calculateDistance,
   generateUniqueBookingNumber,
   prepareRideDateTime,
} from "./booking.utils";
import { uploadMultipleFilesIntoCloudinary } from "@/app/utils/upload-file-into-cloudinary";
import { Booking, GkvBooking, PrivateBooking } from "./booking.model";
import {
   BookingPaymentStatus,
   BookingStatus,
   BookingType,
   PaymentMethod,
} from "./booking.constant";
import { Pricing } from "../Pricing";
import { Surcharge, type ISurcharge, type ISurchargeDoc } from "../Surcharge";
import mongoose, { Types, type PipelineStage } from "mongoose";
import type { IAuthDoc } from "../Auth/auth.interface";
import { Transaction, TransactionStatus } from "../Transaction";
import { TrackingState } from "../TrackingState";
import { getIO } from "../../configs/socket";

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

   // Emit socket event to the company room
   try {
      getIO()
         .to(`company_room_${company?._id}`)
         .emit("new_booking", gkvBooking);
   } catch (error) {
      console.error("Socket error on new GKV booking:", error);
   }

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

   // Emit socket event to the company room
   try {
      getIO()
         .to(`company_room_${company?._id}`)
         .emit("new_booking", privateBooking);
   } catch (error) {
      console.error("Socket error on new private booking:", error);
   }

   return privateBooking;
};

const getBookingsFromDB = async (query: TGetAllBookingQuery) => {
   const {
      page: currentPage = 1,
      limit: currentLimit = 10,
      bookingStatus,
      paymentStatus,
      assignedDriverId,
      bookingNumber,
      companyId,
      bookingType,
      fromDate,
      toDate,
      sortBy,
      sortOrder,
      searchTerm,
      bookingId,
   } = query;

   const page = Math.max(Number(currentPage), 1);
   const limit = Number(currentLimit) || 10;

   const skip = (Number(page) - 1) * Number(limit);

   const pipeline: PipelineStage[] = [];

   const matchConditions: Record<string, unknown> = {};

   if (bookingStatus) matchConditions.bookingStatus = bookingStatus;
   if (paymentStatus) matchConditions.paymentStatus = paymentStatus;
   if (bookingNumber) matchConditions.bookingNumber = bookingNumber;
   if (bookingType) matchConditions.bookingType = bookingType;
   if (bookingId) matchConditions._id = new Types.ObjectId(bookingId);

   if (assignedDriverId) {
      matchConditions.assignedDriver = new Types.ObjectId(assignedDriverId);
   }

   if (companyId) {
      matchConditions.company = new Types.ObjectId(companyId);
   }

   if (Object.values(matchConditions)?.length > 0) {
      console.log(matchConditions);
      pipeline.push({
         $match: matchConditions,
      });
   }

   if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};

      if (fromDate) {
         dateFilter.$gte = new Date(fromDate);
      }
      if (toDate) {
         dateFilter.$lte = new Date(toDate);
      }

      pipeline.push({
         $match: {
            createdAt: dateFilter,
         },
      });
   }

   pipeline.push(
      {
         $lookup: {
            from: "auths",
            localField: "company",
            foreignField: "_id",
            as: "companyDetails",
            pipeline: [
               {
                  $lookup: {
                     from: "companies",
                     localField: "_id",
                     foreignField: "user",
                     as: "companyProfile",
                  },
               },
               {
                  $unwind: {
                     path: "$companyProfile",
                     preserveNullAndEmptyArrays: true,
                  },
               },
            ],
         },
      },
      {
         $unwind: { path: "$companyDetails", preserveNullAndEmptyArrays: true },
      },
      {
         $lookup: {
            from: "auths",
            localField: "assignedDriver",
            foreignField: "_id",
            as: "driverDetails",
         },
      },
      { $unwind: { path: "$driverDetails", preserveNullAndEmptyArrays: true } },
      {
         $addFields: {
            // Company User
            assignedDriver: { $ifNull: ["$assignedDriver", null] },
            companyId: "$companyDetails._id",
            companyName: "$companyDetails.name",
            companyEmail: "$companyDetails.email",
            companyPhone: "$companyDetails.phone",
            companyProfileImage: "$companyDetails.profileImage",
            companyProfileId: "$companyDetails.companyProfile._id",
            companyBusinessName: "$companyDetails.companyProfile.companyName",
            companyCode: "$companyDetails.companyProfile.companyCode",
            driverId: "$driverDetails._id",
            driverName: "$driverDetails.name",
            driverEmail: "$driverDetails.email",
            driverPhone: "$driverDetails.phone",
            driverProfileImage: "$driverDetails.profileImage",
         },
      },
      {
         $project: {
            companyDetails: 0,
            driverDetails: 0,
         },
      },
   );

   const searchableFields = [
      "patientName",
      "bookingNumber",
      "pickupAddress",
      "destinationAddress",
      "driverPhone",
      "driverEmail",
      "driverName",
      "companyCode",
      "companyBusinessName",
      "companyName",
      "companyEmail",
   ];

   if (searchTerm) {
      pipeline.push({
         $match: {
            $or: searchableFields.map((field) => ({
               [field]: {
                  $regex: searchTerm,
                  $options: "i",
               },
            })),
         },
      });
   }

   if (sortBy) {
      pipeline.push({
         $sort: {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
         },
      });
   }

   pipeline.push(
      { $sort: { createdAt: -1 } },
      {
         $facet: {
            data: [{ $skip: skip }, { $limit: Number(limit) }],
            meta: [{ $count: "total" }],
         },
      },
   );

   const result = await Booking.aggregate(pipeline);
   const data = result[0]?.data || [];
   const total = result[0]?.meta[0]?.total || 0;
   const totalPages = Math.ceil(total / Number(limit));

   return {
      data,
      meta: {
         page: Number(page),
         limit: Number(limit),
         total,
         totalPages,
      },
   };
};

const validateBookingForAssignment = async (bookingId: string) => {
   const booking = await Booking.findById(bookingId);

   if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found.");
   }

   if (booking.assignedDriver) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "A driver has already been assigned to this booking.",
      );
   }

   if (
      booking.bookingStatus === BookingStatus.CANCELLED ||
      booking.bookingStatus === BookingStatus.COMPLETED
   ) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         `You cannot assign a driver because the booking is already ${booking.bookingStatus.toLowerCase()}.`,
      );
   }

   if (booking.bookingStatus !== BookingStatus.NEW) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         `Only bookings with status "${BookingStatus.NEW}" can be assigned.`,
      );
   }

   if (booking.bookingType === BookingType.PRIVATE) {
      const privateBooking = await PrivateBooking.findById(booking._id);

      if (!privateBooking) {
         throw new AppError(httpStatus.NOT_FOUND, "Private booking not found.");
      }

      if (
         privateBooking.paymentMethod === PaymentMethod.BANK_TRANSFER &&
         privateBooking.paymentStatus !== BookingPaymentStatus.PAID
      ) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Bank transfer bookings must be paid before assigning a driver.",
         );
      }
   }

   return booking;
};

const assignDriverByCompany = async (
   companyUser: IAuthDoc,
   bookingId: string,
   driverId: string,
) => {
   const booking = await validateBookingForAssignment(bookingId);

   if (booking.company.toString() !== companyUser._id.toString()) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "This booking does not belong to your company.",
      );
   }

   const driverProfile = await Driver.findOne({
      user: driverId,
      company: companyUser._id,
   });

   if (!driverProfile) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "The selected driver does not belong to your company.",
      );
   }

   const driverUser = await Auth.findOne({
      _id: driverId,
      role: AuthRole.DRIVER,
      status: AuthStatus.ACTIVE,
   });

   if (!driverUser) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver not found or inactive.");
   }

   const conflictExists = await Booking.exists({
      assignedDriver: driverId,
      rideDate: booking.rideDate,
      rideTime: booking.rideTime,
      bookingStatus: BookingStatus.ASSIGNED,
   });

   if (conflictExists) {
      throw new AppError(
         httpStatus.CONFLICT,
         "This driver already has another booking at the same date and time.",
      );
   }

   booking.assignedDriver = driverUser._id;
   booking.bookingStatus = BookingStatus.ASSIGNED;

   await booking.save();

   // Notify the driver in real-time
   try {
      getIO()
         .to(`user_room_${driverUser._id}`)
         .emit("driver_assigned", booking);
   } catch (error) {
      console.error("Socket error on driver assignment:", error);
   }

   return booking;
};

const assignBookingToSelf = async (driverUser: IAuthDoc, bookingId: string) => {
   const booking = await validateBookingForAssignment(bookingId);

   const driverProfile = await Driver.findOne({
      user: driverUser._id,
   });

   if (!driverProfile) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found.");
   }

   if (driverProfile.company.toString() !== booking.company.toString()) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "This booking does not belong to your company.",
      );
   }

   const conflictExists = await Booking.exists({
      assignedDriver: driverUser._id,
      rideDate: booking.rideDate,
      rideTime: booking.rideTime,
      bookingStatus: BookingStatus.ASSIGNED,
   });

   if (conflictExists) {
      throw new AppError(
         httpStatus.CONFLICT,
         "You already have another booking at the same date and time.",
      );
   }

   booking.assignedDriver = driverUser._id;
   booking.bookingStatus = BookingStatus.ASSIGNED;

   await booking.save();

   // Notify the driver in real-time (if needed, though they assigned it themselves)
   try {
      getIO()
         .to(`user_room_${driverUser._id}`)
         .emit("driver_assigned", booking);
   } catch (error) {
      console.error("Socket error on self assignment:", error);
   }

   return booking;
};

const rejectAssignment = async (driverUser: IAuthDoc, bookingId: string) => {
   const booking = await Booking.findById(bookingId);

   if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found.");
   }

   if (booking.bookingStatus !== BookingStatus.ASSIGNED) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         `You cannot reject a booking with status "${booking.bookingStatus}".`,
      );
   }

   const driverProfile = await Driver.findOne({
      user: driverUser._id,
   });

   if (!driverProfile) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found.");
   }

   if (driverProfile.company.toString() !== booking.company.toString()) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "This booking does not belong to your company.",
      );
   }

   if (booking.assignedDriver?.toString() !== driverUser._id.toString()) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "This booking is not assigned to you.",
      );
   }

   // Reject assignment
   booking.assignedDriver = undefined;
   booking.bookingStatus = BookingStatus.NEW;

   await booking.save();

   // Notify the company in real-time that driver rejected
   try {
      getIO()
         .to(`company_room_${booking.company}`)
         .emit("booking_rejected", booking);
   } catch (error) {
      console.error("Socket error on booking rejection:", error);
   }

   return booking;
};

// Update Status (State Machine transition validation)
const updateBookingStatus = async (
   user: IAuthDoc,
   bookingId: string,
   status: string,
) => {
   const query: Record<string, any> = { _id: bookingId };

   // Defensive checks
   if (user.role === AuthRole.DRIVER) {
      query.assignedDriver = user._id;
   } else if (user.role === AuthRole.COMPANY) {
      query.company = user._id;
   }

   const booking = await Booking.findOne(query);
   if (!booking)
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Booking details not found or unauthorized access.",
      );

   const current = booking.bookingStatus;
   const next = status as (typeof BookingStatus)[keyof typeof BookingStatus];

   // Guarding State Transitions
   if (current === BookingStatus.COMPLETED) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Completed bookings cannot be updated further.",
      );
   }
   if (current === BookingStatus.CANCELLED) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Cancelled bookings cannot be reactivated.",
      );
   }

   // Disallow illegal state jumps
   if (next === BookingStatus.COMPLETED && current === BookingStatus.NEW) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "A ride must be assigned to a driver before it can be marked completed.",
      );
   }

   booking.bookingStatus = next as any;
   await booking.save();

   return booking;
};

// ** Do payment for the booking:
const payForBookingByID = async (
   bookingId: string,
   payload: TPayForBookingByID,
) => {
   const { paymentMethod: paymentMethodFromUser, referenceNumber } = payload;

   // ?? check existing booking :
   const existingBooking = await PrivateBooking.findOne({
      _id: bookingId,
   });

   if (!existingBooking) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Booking not found with this id.",
      );
   }

   // ?? Check booking status :
   if (existingBooking.bookingStatus !== BookingStatus.NEW) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         `You can submit payment info  for new booking only. Current Status "${existingBooking.bookingStatus}"`,
      );
   }

   // ?? Check is booking payment status already paid:
   if (existingBooking.paymentStatus === BookingPaymentStatus.PAID) {
      throw new AppError(
         httpStatus.CONFLICT,
         "This booking has already been fully paid.",
      );
   }

   if (
      existingBooking.paymentStatus === BookingPaymentStatus.PAYMENT_SUBMITTED
   ) {
      const message =
         existingBooking.paymentMethod === PaymentMethod.BANK_TRANSFER
            ? "A payment reference has already been submitted and is awaiting verification."
            : existingBooking.paymentMethod === PaymentMethod.CASH
              ? "Cash payment has already been marked as submitted and is awaiting verification."
              : "Payment has already been submitted and is awaiting verification.";

      throw new AppError(httpStatus.CONFLICT, message);
   }

   if (paymentMethodFromUser === "BANK_TRANSFER" && !referenceNumber) {
      throw new AppError(httpStatus.NOT_FOUND, `Reference number is required`);
   }

   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      const payload: Record<string, unknown> = {
         paymentMethod: paymentMethodFromUser,
         paymentStatus: BookingPaymentStatus.PAYMENT_SUBMITTED,
      };

      if (paymentMethodFromUser === "BANK_TRANSFER") {
         payload["paymentReference"] = referenceNumber;
      }

      const updatedBooking = await PrivateBooking.findOneAndUpdate(
         {
            _id: bookingId,
         },
         payload,
         {
            new: true,
            session,
         },
      );

      if (!updatedBooking) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to updated the booking.",
         );
      }

      const [transaction] = await Transaction.create(
         [
            {
               booking: updatedBooking?._id,
               amount: updatedBooking?.estimatedFixedPrice,
               gateway: paymentMethodFromUser === "CASH" ? "cash" : "manual",
               gatewayTransactionId: referenceNumber?.trim(),
               status: TransactionStatus.PENDING,
            },
         ],
         { session },
      );

      if (!transaction) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to updated the transaction.",
         );
      }

      await session.commitTransaction();
      await session.endSession();
      return { transaction, updatedBooking };
   } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
   }
};

// ** Verify Payment Reference By Company **
const verifyPayment = async (
   user: IAuthDoc,
   bookingId: string,
   referenceNumber: string,
) => {
   // ?? Check booking exists ?:
   const privateBooking = await PrivateBooking.findOne({
      _id: bookingId,
   });

   if (!privateBooking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found.");
   }

   if (privateBooking.company?.toString() !== user?._id?.toString()) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "This booking is not belongs to your company.",
      );
   }

   // ?? Check booking status :
   if (privateBooking.bookingStatus !== BookingStatus.NEW) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         `You can submit payment info  for new booking only. Current Status "${privateBooking.bookingStatus}"`,
      );
   }

   // ??
   if (privateBooking.paymentMethod === PaymentMethod.CASH) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Cash payment will be verified by driver.",
      );
   }

   // ?? Check is booking payment status already paid:
   if (
      privateBooking.paymentStatus !== BookingPaymentStatus.PAYMENT_SUBMITTED
   ) {
      throw new AppError(
         httpStatus.CONFLICT,
         `Only bookings with a submitted payment can be verified. Current payment status: "${privateBooking.paymentStatus}"`,
      );
   }
   const isMatched =
      privateBooking.paymentReference?.trim().toUpperCase() ===
      referenceNumber.trim().toUpperCase();

   const currentStatus = isMatched
      ? BookingPaymentStatus.PAID
      : BookingPaymentStatus.FAILED;

   const tranStatus = isMatched
      ? TransactionStatus.SUCCESS
      : TransactionStatus.FAILED;

   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      const updatedBooking = await PrivateBooking.findOneAndUpdate(
         {
            _id: bookingId,
         },
         {
            paymentStatus: currentStatus,
         },
         {
            new: true,
            session,
         },
      );

      if (!updatedBooking) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to updated the booking.",
         );
      }

      const transaction = await Transaction.findOneAndUpdate(
         {
            booking: updatedBooking?._id,
            status: TransactionStatus.PENDING,
         },
         {
            verifiedBy: user?._id,
            status: tranStatus,
         },
         {
            sort: { createdAt: -1 },
            new: true,
            session,
         },
      );

      if (!transaction) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to updated the transaction.",
         );
      }

      await session.commitTransaction();
      await session.endSession();
      return { transaction, updatedBooking };
   } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
   }
};

// ** CASH receive

const cashReceiveForBookingByID = async (
   driverUser: IAuthDoc,
   bookingId: string,
) => {
   // ?? Check
   const booking = await PrivateBooking.findById(bookingId);
   if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found.");
   }

   // 1. Is driver assigned ?:
   const driverProfile = await Driver.findOne({ user: driverUser._id });
   if (!driverProfile) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found.");
   }

   if (booking.assignedDriver?.toString() !== driverUser._id.toString()) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "Access denied. This booking is not assigned to you.",
      );
   }

   // 2. Booking Status checking:
   if (booking.bookingStatus !== BookingStatus.ASSIGNED) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "You can receive cash while the booking status is assigned.",
      );
   }

   if (booking.paymentMethod !== PaymentMethod.CASH) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         `Only driver can receive cash payment. Payment method is  "${booking.paymentMethod}"`,
      );
   }

   const session = await mongoose.startSession();

   try {
      session.startTransaction();

      booking.paymentStatus = BookingPaymentStatus.PAID;

      const updatedBooking = await booking.save({
         session,
         validateBeforeSave: true,
      });

      if (!updatedBooking) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to update booking payment status.",
         );
      }

      const payment = await Transaction.findOneAndUpdate(
         {
            booking: updatedBooking?._id,
            status: TransactionStatus.PENDING,
         },
         {
            $set: {
               status: TransactionStatus.SUCCESS,
            },
         },
         {
            sort: { createdAt: -1 },
            returnDocument: "after",
            session,
         },
      );

      if (!updatedBooking) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to update transaction info.",
         );
      }

      await session.commitTransaction();
   } catch (error) {
      await session.abortTransaction();
      throw error;
   } finally {
      await session.endSession();
   }
};

// ** Start Booking Live Tracking**
const startBookingByDriver = async (
   driverUser: IAuthDoc,
   bookingId: string,
   driverCoords: { longitude: number; latitude: number },
) => {
   const { longitude: driverLng, latitude: driverLat } = driverCoords;

   const booking = await Booking.findById(bookingId);
   if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found.");
   }

   // 1. Is driver assigned ?:
   const driverProfile = await Driver.findOne({ user: driverUser._id });
   if (!driverProfile) {
      throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found.");
   }

   if (booking.assignedDriver?.toString() !== driverUser._id.toString()) {
      throw new AppError(
         httpStatus.FORBIDDEN,
         "Access denied. This booking is not assigned to you.",
      );
   }

   // 2. Booking Status checking:
   if (booking.bookingStatus !== BookingStatus.ASSIGNED) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "This ride cannot be started.",
      );
   }

   if (booking.bookingType === "private") {
      const privateBooking = await PrivateBooking.findOne({
         _id: booking?._id,
      });

      if (
         privateBooking?.paymentMethod === PaymentMethod.CASH &&
         privateBooking.paymentStatus !== BookingPaymentStatus.PAID
      ) {
         throw new AppError(
            httpStatus.NOT_FOUND,
            "Booking payment is pending. Please receive the cash.",
         );
      }
   }

   // 3. driver coordinates within 50  km
   const [pickupLng, pickupLat] = booking.pickupLocation.coordinates;

   // 4. Distance calculation :
   const distanceInKm = calculateDistance(
      driverLng,
      driverLat,
      pickupLng,
      pickupLat,
   );
   const distanceInMeters = distanceInKm * 1000;

   console.log({ distanceInKm, distanceInMeters });

   // Check  is distance 50 ? :
   if (distanceInMeters > 100) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         `Sie müssen sich am Abholort befinden, um die Fahrt zu starten. Sie sind aktuell ca. ${Math.round(distanceInMeters)} Meter entfernt (maximal zulässiger Abstand: 100 Meter).`,
      );
   }

   const session = await mongoose.startSession();
   try {
      session.startTransaction();

      booking.bookingStatus = BookingStatus.STARTED;
      const updatedBooking = await booking.save({ session });

      const coordinatesStringArray =
         booking.pickupLocation.coordinates.map(String);

      const tracking = await TrackingState.findOneAndUpdate(
         { booking: booking._id },
         {
            $set: {
               address: booking.pickupAddress,
               addressLocation: {
                  type: "Point",
                  coordinates: coordinatesStringArray,
               },
               progress: 0.0,
               running: true,
            },
         },
         { returnDocument: "after", upsert: true, session },
      );

      await session.commitTransaction();
      await session.endSession();

      return { booking: updatedBooking, tracking };
   } catch (error) {
      await session.abortTransaction();
      await session.endSession();
      throw error;
   }
};

export const BookingServices = {
   createGkbBooking,
   createPrivateBooking,
   getBookingsFromDB,
   payForBookingByID,
   verifyPayment,
   assignDriverByCompany,
   assignBookingToSelf,
   rejectAssignment,
   cashReceiveForBookingByID,
   startBookingByDriver,
};
