import type { Document, Model, Types } from "mongoose";

export interface ISurcharge {
   user: Types.ObjectId;
   // pricing: Types.ObjectId;
   labelSlug: string;
   label: string;
   amount: number;
}

export interface ISurchargeDoc extends ISurcharge, Document {}
