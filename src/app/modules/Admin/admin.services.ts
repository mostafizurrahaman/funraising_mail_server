import { Company } from "../Company/company.model";
import { Auth } from "../Auth/auth.model";
import { Booking } from "../Booking/booking.model";
import { Driver } from "../Driver/driver.model";
import httpStatus from "http-status";
import { AppError } from "../../errors";
import {
   BookingStatus,
   BookingType,
   BookingPaymentStatus,
} from "../Booking/booking.constant";
import { AuthRole, AuthStatus } from "../Auth/auth.constant";
import { Types } from "mongoose";

const getAllCompanies = async (query: Record<string, unknown>) => {
   const { status, searchTerm, ...filterData } = query;
   const conditions: any[] = [];

   if (status) {
      conditions.push({ "user.status": status });
   }

   const data = await Company.find().populate({
      path: "user",
      match: conditions.length > 0 ? { $and: conditions } : {},
   });

   // Filter out companies whose auth doc doesn't match the populated match condition
   const filteredData = data.filter((doc) => doc.user != null);

   return filteredData;
};

const updateCompanyStatus = async (
   companyId: string,
   payload: { status: string },
) => {
   const company = await Company.findById(companyId);
   if (!company) {
      throw new AppError(httpStatus.NOT_FOUND, "Company not found!");
   }

   const authDoc = await Auth.findByIdAndUpdate(
      company.user,
      { status: payload.status },
      { new: true },
   );

   if (!authDoc) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "User associated with company not found!",
      );
   }

   return company;
};

const deleteCompany = async (companyId: string) => {
   const company = await Company.findById(companyId);
   if (!company) {
      throw new AppError(httpStatus.NOT_FOUND, "Company not found!");
   }

   // delete both Auth and Company
   await Auth.findByIdAndDelete(company.user);
   const deletedCompany = await Company.findByIdAndDelete(companyId);

   return deletedCompany;
};

const getAdminOverview = async () => {
   const now = new Date();
   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

   const [bookingStats, companyStats, driverStats, revenueAgg] =
      await Promise.all([
         // Booking counts by status
         Booking.aggregate([
            {
               $facet: {
                  total: [{ $count: "count" }],
                  newB: [
                     { $match: { bookingStatus: BookingStatus.NEW } },
                     { $count: "count" },
                  ],
                  assigned: [
                     { $match: { bookingStatus: BookingStatus.ASSIGNED } },
                     { $count: "count" },
                  ],
                  started: [
                     { $match: { bookingStatus: BookingStatus.STARTED } },
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
                  gkv: [
                     { $match: { bookingType: BookingType.GKV } },
                     { $count: "count" },
                  ],
                  private: [
                     { $match: { bookingType: BookingType.PRIVATE } },
                     { $count: "count" },
                  ],
               },
            },
         ]),
         // Company counts
         Auth.aggregate([
            { $match: { role: AuthRole.COMPANY } },
            {
               $facet: {
                  total: [{ $count: "count" }],
                  active: [
                     { $match: { status: AuthStatus.ACTIVE } },
                     { $count: "count" },
                  ],
                  pending: [
                     { $match: { status: AuthStatus.PENDING } },
                     { $count: "count" },
                  ],
               },
            },
         ]),
         // Driver counts
         Auth.aggregate([
            { $match: { role: AuthRole.DRIVER } },
            {
               $facet: {
                  total: [{ $count: "count" }],
                  active: [
                     { $match: { status: AuthStatus.ACTIVE } },
                     { $count: "count" },
                  ],
               },
            },
         ]),
         // Revenue this month (platform fees from completed bookings)
         Booking.aggregate([
            {
               $match: {
                  bookingStatus: BookingStatus.COMPLETED,
                  createdAt: { $gte: startOfMonth },
               },
            },
            { $group: { _id: null, total: { $sum: "$platformFee" } } },
         ]),
      ]);

   const pick = (arr: any[], key: string) => arr?.[0]?.[key]?.[0]?.count ?? 0;

   return {
      bookings: {
         total: pick(bookingStats, "total"),
         new: pick(bookingStats, "newB"),
         assigned: pick(bookingStats, "assigned"),
         started: pick(bookingStats, "started"),
         completed: pick(bookingStats, "completed"),
         cancelled: pick(bookingStats, "cancelled"),
         gkv: pick(bookingStats, "gkv"),
         private: pick(bookingStats, "private"),
      },
      companies: {
         total: pick(companyStats, "total"),
         active: pick(companyStats, "active"),
         pending: pick(companyStats, "pending"),
      },
      drivers: {
         total: pick(driverStats, "total"),
         active: pick(driverStats, "active"),
      },
      revenue: {
         thisMonth: revenueAgg?.[0]?.total ?? 0,
      },
   };
};

const getCompanyOverview = async (companyAuthId: string) => {
   const [bookingStats, driverStats] = await Promise.all([
      Booking.aggregate([
         { $match: { company: new Types.ObjectId(companyAuthId) as any } },
         {
            $facet: {
               total: [{ $count: "count" }],
               newB: [
                  { $match: { bookingStatus: BookingStatus.NEW } },
                  { $count: "count" },
               ],
               assigned: [
                  { $match: { bookingStatus: BookingStatus.ASSIGNED } },
                  { $count: "count" },
               ],
               started: [
                  { $match: { bookingStatus: BookingStatus.STARTED } },
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
               gkv: [
                  { $match: { bookingType: BookingType.GKV } },
                  { $count: "count" },
               ],
               private: [
                  { $match: { bookingType: BookingType.PRIVATE } },
                  { $count: "count" },
               ],
               pending: [
                  { $match: { paymentStatus: BookingPaymentStatus.PENDING } },
                  { $count: "count" },
               ],
               paid: [
                  { $match: { paymentStatus: BookingPaymentStatus.PAID } },
                  { $count: "count" },
               ],
            },
         },
      ]),
      Driver.aggregate([
         { $match: { company: new Types.ObjectId(companyAuthId) as any } },
         {
            $facet: {
               total: [{ $count: "count" }],
            },
         },
      ]),
   ]);

   const pick = (arr: any[], key: string) => arr?.[0]?.[key]?.[0]?.count ?? 0;

   return {
      bookings: {
         total: pick(bookingStats, "total"),
         new: pick(bookingStats, "newB"),
         assigned: pick(bookingStats, "assigned"),
         started: pick(bookingStats, "started"),
         completed: pick(bookingStats, "completed"),
         cancelled: pick(bookingStats, "cancelled"),
         gkv: pick(bookingStats, "gkv"),
         private: pick(bookingStats, "private"),
         pendingPayment: pick(bookingStats, "pending"),
         paid: pick(bookingStats, "paid"),
      },
      drivers: {
         total: pick(driverStats, "total"),
      },
   };
};

export const AdminServices = {
   getAllCompanies,
   updateCompanyStatus,
   deleteCompany,
   getAdminOverview,
   getCompanyOverview,
};
