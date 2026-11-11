import { model, Schema } from "mongoose";
import type { ISupportMessageDoc } from "./support.interface";

const supportMessageSchema = new Schema<ISupportMessageDoc>(
   {
      name: {
         type: String,
         required: true,
         trim: true,
      },
      email: {
         type: String,
         required: true,
         trim: true,
         lowercase: true,
      },
      phone: {
         type: String,
         trim: true,
      },
      subject: {
         type: String,
         required: true,
         trim: true,
      },
      message: {
         type: String,
         required: true,
         trim: true,
      },
      status: {
         type: String,
         enum: ["new", "in_progress", "resolved"],
         default: "new",
      },
      adminNote: {
         type: String,
         trim: true,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

export const SupportMessage = model<ISupportMessageDoc>(
   "SupportMessage",
   supportMessageSchema,
);

