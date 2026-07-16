import { model, Schema } from "mongoose";
import type { IBookingSurchargeDoc } from "./booking-surcharge.interface";

const bookingSurchargeSchema = new Schema<IBookingSurchargeDoc>(
   {
      booking: {
         type: Schema.Types.ObjectId,
         ref: "Booking",
         required: true,
      },
      surcharge: {
         type: Schema.Types.ObjectId,
         ref: "Surcharge",
         required: true,
      },
      label: {
         type: String,
         required: true,
      },
      amount: {
         type: Number,
         min: 0,
         required: true,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

export const BookingSurcharge = model<IBookingSurchargeDoc>(
   "BookingSurcharge",
   bookingSurchargeSchema,
);
