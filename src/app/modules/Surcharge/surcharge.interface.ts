import type { Document, Model, Types } from "mongoose";

export interface ISurcharge {
   user: Types.ObjectId;
   globalSurcharge: Types.ObjectId;
   amount: number;
}

export interface ISurchargeDoc extends ISurcharge, Document {}
