import { model, Schema, Types } from "mongoose";
import type { ISurchargeDoc } from "./surcharge.interface";

const surchargeSchema = new Schema<ISurchargeDoc>(
   {
      user: {
         type: Types.ObjectId,
         ref: "Auth",
         required: true,
      },
      pricing: {
         type: Types.ObjectId,
         ref: "Pricing",
         required: true,
      },
      label: {
         type: String,
         required: true,
      },
      labelSlug: {
         type: String,
         required: true,
      },
      amount: {
         type: String,
         required: true,
         min: 0,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

surchargeSchema.index(
   {
      user: 1,
      pricing: 1,
      labelSlug: 1,
   },
   {
      unique: true,
      name: "uniq_comp_price_lbl",
   },
);

export const Surcharge = model<ISurchargeDoc>("Surcharge", surchargeSchema);
