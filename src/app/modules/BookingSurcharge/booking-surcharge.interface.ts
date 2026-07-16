import type { Document, Model, Types } from "mongoose";

export interface IBookingSurcharge {
   booking: Types.ObjectId;
   surcharge: Types.ObjectId;
   label: string;
   amount: number;
}

export interface IBookingSurchargeDoc extends IBookingSurcharge, Document {}
