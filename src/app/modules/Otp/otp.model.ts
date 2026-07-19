import { model, Schema } from "mongoose";
import type { IOtpDoc } from "./otp.interface";
import { optTypeValues } from "./opt.constant";

const optSchema = new Schema<IOtpDoc>(
   {
      user: {
         type: Schema.Types.ObjectId,
         ref: "Auth",
         required: true,
      },
      otp: {
         type: String,
         required: true,
      },
      type: {
         type: String,
         enum: optTypeValues,
         required: true,
      },
      expiresAt: {
         type: Date,
      },
   },
   {
      versionKey: false,
      timestamps: true,
   },
);

export const OTP = model<IOtpDoc>("Otp", optSchema);
