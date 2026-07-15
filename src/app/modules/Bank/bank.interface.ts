import type { Document, Model, Types } from "mongoose";
import type { TCountry, TCurrency } from "./bank.constant";

export interface IBank {
   user: Types.ObjectId;
   accountHolder: string;
   bankName: string;
   iban: string;
   bic: string;
   country: TCountry;
   currency: TCurrency;
}

export interface IBankDoc extends IBank, Document {}
