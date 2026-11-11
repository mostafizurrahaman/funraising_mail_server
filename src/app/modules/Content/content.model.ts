import { model, Schema } from "mongoose";
import type { IContentDoc } from "./content.interface";

const contentSchema = new Schema<IContentDoc>(
   {
      type: {
         type: String,
         enum: ["terms", "privacy", "impressum"],
         required: true,
         unique: true,
         trim: true,
      },
      title: {
         type: String,
         required: true,
         trim: true,
      },
      content: {
         type: String,
         required: true,
      },
      updatedBy: {
         type: Schema.Types.ObjectId,
         ref: "Auth",
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

export const Content = model<IContentDoc>("Content", contentSchema);

