import { model, Schema, Types } from "mongoose";
import type { ICompanyDoc, IGeoJSONPoint } from "./company.interface";
import { geoLocationType, geoLocationTypeValues } from "./company.constants";

export const serviceAreaSchema = new Schema<IGeoJSONPoint>(
   {
      type: {
         type: String,
         enum: geoLocationTypeValues,
         required: true,
         default: geoLocationType.Point,
      },

      coordinates: {
         type: [Number],
         required: true,
      },
   },
   {
      _id: false,
      versionKey: false,
   },
);

const companySchema = new Schema<ICompanyDoc>(
   {
      user: {
         type: Types.ObjectId,
         ref: "Auth",
         required: true,
      },
      companyName: {
         type: String,
         required: true,
      },
      companyCode: {
         type: String,
         required: true,
         unique: true,
      },
      city: {
         type: String,
         required: true,
      },
      address: {
         type: String,
      },
      serviceArea: {
         type: serviceAreaSchema,
         required: true,
      },
      radiusKm: {
         type: Number,
         required: true,
         min: 1,
      },
      postalCode: {
         type: String,
         required: true,
      },
      fleetSize: {
         type: Number,
         required: true,
         min: 1,
      },
      note: {
         type: String,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

companySchema.index({
   serviceArea: "2dsphere",
});

export const Company = model<ICompanyDoc>("Company", companySchema);
