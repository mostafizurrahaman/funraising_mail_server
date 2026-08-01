import { model, Schema } from "mongoose";
import type { ITrackingStateDoc } from "./tracking-state.interface";
import {
   geoLocationType,
   geoLocationTypeValues,
} from "../Company/company.constants";

const TrackingStateSchema = new Schema<ITrackingStateDoc>(
   {
      booking: {
         type: Schema.Types.ObjectId,
         ref: "Booking",
         required: true,
      },
      address: {
         type: String,
         required: true,
      },
      addressLocation: {
         type: {
            type: String,
            enum: geoLocationTypeValues,
            default: geoLocationType.Point,
            required: true,
         },
         coordinates: {
            type: [String],
            required: true,
            min: 2,
         },
      },
      progress: {
         type: Number,
      },
      running: {
         type: Boolean,
         default: false,
         required: true,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

export const TrackingState = model<ITrackingStateDoc>(
   "TrackingState",
   TrackingStateSchema,
);
