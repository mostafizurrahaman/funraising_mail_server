import { AppError } from "@/app/errors";
import type { IAuthDoc } from "../Auth/auth.interface";
import type { TCreateInvoicePayload } from "./invoice.validation";
import httpStatus from "http-status";
import { Auth } from "../Auth/auth.model";
import { AuthStatus } from "../Auth/auth.constant";
import moment from "moment";
import { Invoice, InvoiceBooking } from "./invoice.model";
import { Booking, BookingPaymentStatus, BookingStatus } from "../Booking";
import mongoose, { mongo } from "mongoose";
import { InvoiceStatus } from "./invoice.constant";
const createInvoice = async (
   user: IAuthDoc,
   payload: TCreateInvoicePayload,
) => {
   const { companyId, monthYear } = payload;
   const [month, year] = monthYear?.split("-");
   if (!month || !year) {
      throw new AppError(httpStatus.BAD_REQUEST, "Month and year is required.");
   }

   // ?? Check is this company exists?:
   const company = await Auth.findOne({
      _id: companyId,
   });

   if (!company) {
      throw new AppError(httpStatus.NOT_FOUND, "Company not found!");
   }

   if (company?.status !== AuthStatus.ACTIVE) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         `Company is not active. Current Status "${company.status}"`,
      );
   }

   //?? Calculate the start date of  this month and end date of this month:

   const startDate = moment(`${month}-${year}`, "MMM-YYYY")
      .startOf("month")
      .toDate();

   const endDate = moment(`${month}-${year}`, "MMM-YYYY")
      .endOf("month")
      .toDate();

   const dueDate = moment().add(5, "days").toDate();

   console.log(startDate);
   console.log(endDate);

   const invoicedBookings = await InvoiceBooking.aggregate([
      {
         $match: {
            createdAt: {
               $gte: startDate,
               $lte: endDate,
            },
         },
      },
      {
         $lookup: {
            from: "bookings",
            localField: "booking",
            foreignField: "_id",
            as: "bookingDetails",
         },
      },
      {
         $unwind: {
            path: "$bookingDetails",
            preserveNullAndEmptyArrays: true,
         },
      },
      {
         $addFields: {
            companyId: "$bookingDetails.company",
         },
      },
      {
         $project: {
            bookingDetails: 0,
         },
      },
      {
         $match: {
            companyId: company?._id,
         },
      },
   ]);

   const alreadyInvoiceBookingsIds =
      invoicedBookings?.map((booking) => booking.booking) || [];

   const newBookings = await Booking?.find({
      company: company?._id,
      bookingStatus: BookingStatus.COMPLETED,
      createdAt: {
         $gte: startDate,
         $lte: endDate,
      },
      _id: {
         $nin: alreadyInvoiceBookingsIds,
      },
   });

   console.log({
      newBookings,
   });

   if (newBookings?.length <= 0) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "No New Bookings found for invoice!",
      );
   }

   const totalRides = newBookings.length || 0;
   const totalAmount = totalRides * 2; // 2 eur per booking

   const session = await mongoose.startSession();

   try {
      session.startTransaction();
      const [invoice] = await Invoice.create(
         [
            {
               user: company?._id,
               amount: totalAmount,
               rides: totalRides,
               period: monthYear,
               startDate: startDate,
               endDate: endDate,
               dueDate: dueDate,
               status: InvoiceStatus.OFFEN,
            },
         ],
         { session },
      );

      if (!invoice) {
         throw new AppError(
            httpStatus.BAD_REQUEST,
            "Failed to create invoice record.",
         );
      }

      const invoiceBookingsPayload = newBookings?.map((booking) => ({
         booking: booking?._id,
         invoice: invoice?._id,
      }));

      console.log(invoiceBookingsPayload);

      await InvoiceBooking.create(invoiceBookingsPayload, {
         session,
         ordered: true,
      });

      await session.commitTransaction();

      return invoice;
   } catch (err) {
      // console.dir(err);

      await session.abortTransaction();
      throw err;
   } finally {
      await session.endSession();
   }
};

export const InvoiceServices = {
   createInvoice,
};
