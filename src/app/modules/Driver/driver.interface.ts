import type { Document, Model, Types } from "mongoose";

export interface IDriver {
   user: Types.ObjectId;
   company: Types.ObjectId;
   vehicleDetails: string;
}

export interface IDriverDoc extends IDriver, Document {}
