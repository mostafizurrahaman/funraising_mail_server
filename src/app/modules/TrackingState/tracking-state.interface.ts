import type { Document, Types } from "mongoose";

import type { IGeoJSONPoint } from "../Company/company.interface";

export interface ITrackingState {
   booking: Types.ObjectId;
   address: string;
   addressLocation: IGeoJSONPoint;
   progress: number;
   running: boolean;
}

export interface ITrackingStateDoc extends ITrackingState, Document {}
