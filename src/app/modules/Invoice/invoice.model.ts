import { model, Schema } from "mongoose";
import type { IInvoiceDoc } from "./invoice.interface";
import { InvoiceStatus } from "./invoice.constant";

const invoiceSchema = new Schema<IInvoiceDoc>(
   {
      user: {
         type: Schema.Types.ObjectId,
         ref: "Company",
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
      bookings: {
         type: [
            {
               type: Schema.Types.ObjectId,
               ref: "Booking",
               required: true,
            },
         ],
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

export const Invoice = model<IInvoiceDoc>("Invoice", invoiceSchema);
