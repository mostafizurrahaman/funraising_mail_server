import { model, Schema, Types } from "mongoose";
import type { IInvoiceBookingDoc, IInvoiceDoc } from "./invoice.interface";
import { InvoiceStatus } from "./invoice.constant";

const invoiceSchema = new Schema<IInvoiceDoc>(
   {
      user: {
         type: Schema.Types.ObjectId,
         ref: "Auth",
         required: true,
         index: true,
      },

      amount: {
         type: Number,
         required: true,
         min: 0,
      },

      rides: {
         type: Number,
         required: true,
         min: 0,
      },
      period: {
         type: String,
         required: true,
         trim: true,
      },

      invoiceUrl: {
         type: String,
         trim: true,
      },

      startDate: {
         type: Date,
         required: true,
      },

      endDate: {
         type: Date,
         required: true,
      },

      status: {
         type: String,
         enum: Object.values(InvoiceStatus),
         default: InvoiceStatus.OFFEN,
      },

      dueDate: {
         type: Date,
         required: true,
      },

      paidAt: {
         type: Date,
         default: null,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

const invoiceBookingSchema = new Schema<IInvoiceBookingDoc>(
   {
      booking: {
         type: Schema.Types.ObjectId,
         ref: "Booking",
         required: true,
         unique: true,
      },
      invoice: {
         type: Schema.Types.ObjectId,
         ref: "Invoice",
         required: true,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

export const Invoice = model<IInvoiceDoc>("Invoice", invoiceSchema);
export const InvoiceBooking = model<IInvoiceBookingDoc>(
   "InvoiceBooking",
   invoiceBookingSchema,
);
