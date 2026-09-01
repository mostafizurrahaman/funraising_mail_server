import type { Document, Model, Types } from "mongoose";

export interface IPricing {
   baseFare: Number;
   perKm: Number;
}

export interface IPricingDoc extends IPricing, Document {}
