import { model, Schema } from "mongoose";
import type { IGlobalSurchargeDoc } from "./globalSurcharge.interface";

const globalSurchargeSchema = new Schema<IGlobalSurchargeDoc>(
   {
      label: {
         type: String,
         required: true,
      },
      labelSlug: {
         type: String,
         required: true,
         unique: true,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

export const GlobalSurcharge = model<IGlobalSurchargeDoc>("GlobalSurcharge", globalSurchargeSchema);
