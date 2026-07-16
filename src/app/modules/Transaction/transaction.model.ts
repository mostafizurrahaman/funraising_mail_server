import { model, Schema } from "mongoose";
import type {
   ITransaction,
   ITransactionDoc,
   ITransactionModel,
} from "./transaction.interface";
import { Currency, CurrencyValues } from "../Bank";
import {
   PaymentGateway,
   PaymentGatewayValues,
   TransactionStatus,
   TransactionStatusValues,
} from "./transaction.constant";

const transactionSchema = new Schema<ITransactionDoc, ITransactionModel>(
   {
      booking: {
         type: Schema.Types.ObjectId,
         ref: "Booking",
         required: true,
      },
      amount: {
         type: Number,
         min: 0,
         required: true,
      },

      currency: {
         type: String,
         enum: CurrencyValues,
         default: Currency.EUR,
      },
      gateway: {
         type: String,
         enum: PaymentGatewayValues,
         default: PaymentGateway.MANUAL_BANK_TRANSFER,
      },
      status: {
         type: String,
         enum: TransactionStatusValues,
         default: TransactionStatus.PENDING,
      },
      gatewayTransactionId: {
         type: String,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

export const Transaction = model<ITransactionDoc, ITransactionModel>(
   "Transaction",
   transactionSchema,
);
