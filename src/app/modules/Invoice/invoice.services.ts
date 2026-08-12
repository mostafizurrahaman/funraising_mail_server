import { AppError } from "../../errors";
import type { IAuthDoc } from "../Auth/auth.interface";
import type { TCreateInvoicePayload } from "./invoice.validation";
import httpStatus from "http-status";
import { Auth } from "../Auth/auth.model";
import { AuthStatus } from "../Auth/auth.constant";
import moment from "moment";
import { Invoice, InvoiceBooking } from "./invoice.model";
import { Booking, BookingPaymentStatus, BookingStatus } from "../Booking";
import mongoose, { mongo } from "mongoose";
import { InvoiceStatus, type TInvoiceStatusType } from "./invoice.constant";
import { uploadBufferIntoCloudinary } from "../../utils/upload-buffer-into-cloudinary";
import { generateInvoicePDF } from "../../utils/pdf-generator";
const createInvoice = async (
   user: IAuthDoc,
   payload: TCreateInvoicePayload,
) => {
   const { companyId, monthYear } = payload;
   const [month, year] = monthYear?.split("-");
   if (!month || !year) {
      throw new AppError(httpStatus.BAD_REQUEST, "Month and year is required.");
   }
   console.log(month, year);

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
            completedAt: {
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
      completedAt: {
         $gte: startDate,
         $lte: endDate,
      },
      _id: {
         $nin: alreadyInvoiceBookingsIds,
      },
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

      // Generate and upload PDF Invoice
      try {
         const items = newBookings.map((booking) => ({
            label: `Booking ${booking.bookingNumber}`,
            amount: 2, // 2 eur per booking
         }));

         const invoiceData = {
            invoiceNumber: invoice._id.toString(),
            date: new Date(),
            companyName: "Aibar Booking", // Platform name
            customerName: company.name,
            customerPhone: company.phone || "",
            items,
            totalAmount,
         };

         const pdfBuffer = await generateInvoicePDF(invoiceData);
         const invoiceResult = await uploadBufferIntoCloudinary(
            pdfBuffer,
            "invoices",
            `monthly-invoice-${invoice._id}`,
         );

         if (invoiceResult?.secure_url) {
            invoice.invoiceUrl = invoiceResult.secure_url;
            await invoice.save();
         }
      } catch (error) {
         console.error("Failed to generate/upload monthly invoice:", error);
      }

      return invoice;
   } catch (err) {
      // console.dir(err);

      await session.abortTransaction();
      throw err;
   } finally {
      await session.endSession();
   }
};

const getAllInvoices = async (query: Record<string, unknown>) => {
   const page = Number(query.page) || 1;
   const limit = Number(query.limit) || 10;
   const skip = (page - 1) * limit;

   const pipeline: mongoose.PipelineStage[] = [];

   if (query.status) {
      pipeline.push({ $match: { status: query.status } });
   }

   const sortBy = (query.sortBy as string) || "createdAt";
   const sortOrder = query.sortOrder === "asc" ? 1 : -1;
   pipeline.push({ $sort: { [sortBy]: sortOrder } });

   pipeline.push(
      {
         $lookup: {
            from: "auths",
            localField: "user",
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
            from: "invoicebookings",
            localField: "_id",
            foreignField: "invoice",
            as: "invoiceBookings",
         },
      },
      {
         $lookup: {
            from: "bookings",
            localField: "invoiceBookings.booking",
            foreignField: "_id",
            as: "bookings",
         },
      },
      {
         $addFields: {
            companyId: "$companyDetails._id",
            companyName: "$companyDetails.name",
            companyEmail: "$companyDetails.email",
            companyPhone: "$companyDetails.phone",
            companyProfileImage: "$companyDetails.profileImage",
            companyProfileId: "$companyDetails.companyProfile._id",
            companyBusinessName: "$companyDetails.companyProfile.companyName",
            companyCode: "$companyDetails.companyProfile.companyCode",
         },
      },
      {
         $project: {
            companyDetails: 0,
            invoiceBookings: 0,
         },
      },
   );

   pipeline.push({
      $facet: {
         data: [{ $skip: skip }, { $limit: limit }],
         meta: [{ $count: "total" }],
      },
   });

   const result = await Invoice.aggregate(pipeline);
   const data = result[0]?.data || [];
   const total = result[0]?.meta[0]?.total || 0;
   const totalPages = Math.ceil(total / limit);

   return {
      data,
      meta: { page, limit, total, totalPages },
   };
};

const getCompanyInvoices = async (
   user: IAuthDoc,
   query: Record<string, unknown>,
) => {
   const page = Number(query.page) || 1;
   const limit = Number(query.limit) || 10;
   const skip = (page - 1) * limit;

   const pipeline: mongoose.PipelineStage[] = [];

   // Filter by company's user ID
   pipeline.push({ $match: { user: user._id } });

   if (query.status) {
      pipeline.push({ $match: { status: query.status } });
   }

   const sortBy = (query.sortBy as string) || "createdAt";
   const sortOrder = query.sortOrder === "asc" ? 1 : -1;
   pipeline.push({ $sort: { [sortBy]: sortOrder } });

   pipeline.push(
      {
         $lookup: {
            from: "auths",
            localField: "user",
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
            from: "invoicebookings",
            localField: "_id",
            foreignField: "invoice",
            as: "invoiceBookings",
         },
      },
      {
         $lookup: {
            from: "bookings",
            localField: "invoiceBookings.booking",
            foreignField: "_id",
            as: "bookings",
         },
      },
      {
         $addFields: {
            companyId: "$companyDetails._id",
            companyName: "$companyDetails.name",
            companyEmail: "$companyDetails.email",
            companyPhone: "$companyDetails.phone",
            companyProfileImage: "$companyDetails.profileImage",
            companyProfileId: "$companyDetails.companyProfile._id",
            companyBusinessName: "$companyDetails.companyProfile.companyName",
            companyCode: "$companyDetails.companyProfile.companyCode",
         },
      },
      {
         $project: {
            companyDetails: 0,
            invoiceBookings: 0,
         },
      },
   );

   pipeline.push({
      $facet: {
         data: [{ $skip: skip }, { $limit: limit }],
         meta: [{ $count: "total" }],
      },
   });

   const result = await Invoice.aggregate(pipeline);
   const data = result[0]?.data || [];
   const total = result[0]?.meta[0]?.total || 0;
   const totalPages = Math.ceil(total / limit);

   return {
      data,
      meta: { page, limit, total, totalPages },
   };
};

const updateInvoiceStatus = async (
   invoiceId: string,
   payload: { status: string },
) => {
   const invoice = await Invoice.findById(invoiceId);

   if (!invoice) {
      throw new AppError(httpStatus.NOT_FOUND, "Invoice not found!");
   }

   invoice.status = payload.status as TInvoiceStatusType;

   if (payload.status === InvoiceStatus.BEZAHLT) {
      invoice.paidAt = new Date();
   } else {
      invoice.paidAt = null as unknown as Date;
   }

   await invoice.save();

   return invoice;
};

export const InvoiceServices = {
   createInvoice,
   getAllInvoices,
   getCompanyInvoices,
   updateInvoiceStatus,
};
