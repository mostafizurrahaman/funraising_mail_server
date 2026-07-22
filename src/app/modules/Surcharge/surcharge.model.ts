import { model, Schema, Types } from "mongoose";
import type { ISurchargeDoc } from "./surcharge.interface";

const surchargeSchema = new Schema<ISurchargeDoc>(
   {
      user: {
         type: Schema.Types.ObjectId,
         ref: "Auth",
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

surchargeSchema.index(
   {
      user: 1,
      labelSlug: 1,
   },
   {
      unique: true,
      name: "uniq_comp_lbl",
   },
);

export const Surcharge = model<ISurchargeDoc>("Surcharge", surchargeSchema);
