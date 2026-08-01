import { model, Schema } from "mongoose";
import type { IDriverDoc } from "./driver.interface";

const driverSchema = new Schema<IDriverDoc>(
   {
      user: {
         type: Schema.Types.ObjectId,
         ref: "Auth",
         required: true,
      },
      company: {
         type: Schema.Types.ObjectId,
         ref: "Auth",
         required: true,
      },
      vehicleDetails: {
         type: String,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

export const Driver = model<IDriverDoc>("Driver", driverSchema);
