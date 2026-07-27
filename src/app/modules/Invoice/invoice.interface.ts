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
}

export interface IInvoiceBooking {
   booking: Types.ObjectId;
   invoice: Types.ObjectId;
}

export interface IInvoiceDoc extends IInvoice, Document {}
export interface IInvoiceBookingDoc extends IInvoiceBooking, Document {}
