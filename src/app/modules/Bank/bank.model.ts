import { model, Schema, Types } from "mongoose";
import type { IBankDoc } from "./bank.interface";

const bankSchema = new Schema<IBankDoc>(
   {
      user: {
         type: Schema.Types.ObjectId,
         ref: "User",
         required: true,
         unique: true,
      },
      bankName: {
         type: String,
         required: true,
      },
      accountHolder: {
         type: String,
         required: true,
      },
      iban: {
         type: String,
         required: true,
      },
      bic: {
         type: String,
         required: true,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

export const Bank = model<IBankDoc>("Bank", bankSchema);
