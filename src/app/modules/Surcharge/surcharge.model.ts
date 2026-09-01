import { model, Schema, Types } from "mongoose";
import type { ISurchargeDoc } from "./surcharge.interface";

const surchargeSchema = new Schema<ISurchargeDoc>(
   {
      user: {
         type: Schema.Types.ObjectId,
         ref: "Auth",
         required: true,
      },
      globalSurcharge: {
         type: Schema.Types.ObjectId,
         ref: "GlobalSurcharge",
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
      globalSurcharge: 1,
   },
   {
      unique: true,
      name: "uniq_comp_global_surcharge",
   },
);

export const Surcharge = model<ISurchargeDoc>("Surcharge", surchargeSchema);
