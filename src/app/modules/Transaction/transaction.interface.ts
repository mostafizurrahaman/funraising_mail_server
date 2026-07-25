import type { Document, Model, Types } from "mongoose";
import type { TCurrency } from "../Bank";
import type {
   TPaymentGateway,
   TTransactionStatusType,
} from "./transaction.constant";

export interface ITransaction {
   booking: Types.ObjectId;
   verifiedBy: Types.ObjectId;
   amount: number;
   currency: TCurrency;
   gateway: TPaymentGateway;
   status: TTransactionStatusType;
   gatewayTransactionId: string;
}

export interface ITransactionDoc extends ITransaction, Document {}
