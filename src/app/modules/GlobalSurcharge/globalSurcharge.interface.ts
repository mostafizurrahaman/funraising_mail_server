import { Document, Types } from "mongoose";

export interface IGlobalSurcharge {
   label: string;
   labelSlug: string;
}

export interface IGlobalSurchargeDoc extends IGlobalSurcharge, Document {
   _id: Types.ObjectId;
   createdAt: Date;
   updatedAt: Date;
}
