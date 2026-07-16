import type { Document, Model, Types } from "mongoose";
import type { TInvoiceStatusType } from "./invoice.constant";

export interface IInvoice {
   user: Types.ObjectId;
   amount: number;
   rides: number;
   period: string;
   startDate: Date;
   endDate: Date;
   dueDate: Date;
   paidAt: Date;
   status: TInvoiceStatusType;
   invoiceUrl: string;
   bookings: Types.ObjectId[];
}

export interface IInvoiceDoc extends IInvoice, Document {}
