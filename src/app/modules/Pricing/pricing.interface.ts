import type { Document, Model, Types } from "mongoose";

export interface IPricing {
   user: Types.ObjectId;
   baseFare: Number;
   perKm: Number;
}

export interface IPricingDoc extends IPricing, Document {}
