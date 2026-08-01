import { model, Schema, Types } from "mongoose";
import type { IPricingDoc } from "./pricing.interface";

const pricingSchema = new Schema<IPricingDoc>(
   {
      user: {
         type: Types.ObjectId,
         ref: "Auth",
         required: true,
         unique: true,
      },
      baseFare: {
         type: Number,
         required: true,
         min: 0,
      },
      perKm: {
         type: Number,
         required: true,
         min: 0,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

export const Pricing = model<IPricingDoc>("Pricing", pricingSchema);
