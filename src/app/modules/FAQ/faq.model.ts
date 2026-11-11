import { model, Schema } from "mongoose";
import type { IFAQDoc } from "./faq.interface";

const faqSchema = new Schema<IFAQDoc>(
   {
      question: {
         type: String,
         required: true,
         trim: true,
      },
      answer: {
         type: String,
         required: true,
         trim: true,
      },
      category: {
         type: String,
         default: "General",
         trim: true,
      },
      order: {
         type: Number,
         default: 0,
      },
      isActive: {
         type: Boolean,
         default: true,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

export const FAQ = model<IFAQDoc>("FAQ", faqSchema);

