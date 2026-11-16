import { Schema, model } from "mongoose";
import { IPostalCodeDoc } from "./postalCode.interface";
import { geoLocationType, geoLocationTypeValues } from "../Company/company.constants";

const postalCodeLocationSchema = new Schema(
   {
      type: {
         type: String,
         enum: geoLocationTypeValues,
         required: true,
         default: geoLocationType.Point,
      },
      coordinates: {
         type: [Number], // [Longitude, Latitude]
         required: true,
      },
   },
   {
      _id: false,
      versionKey: false,
   },
);

const postalCodeSchema = new Schema<IPostalCodeDoc>(
   {
      countryCode: {
         type: String,
         default: "DE",
         trim: true,
         uppercase: true,
      },
      postalCode: {
         type: String,
         required: true,
         trim: true,
         index: true,
      },
      placeName: {
         type: String,
         required: true,
         trim: true,
      },
      adminName: {
         type: String,
         required: true,
         trim: true,
      },
      adminCode: {
         type: String,
         trim: true,
         uppercase: true,
      },
      slug: {
         type: String,
         required: true,
         unique: true,
         trim: true,
         lowercase: true,
      },
      latitude: {
         type: Number,
         required: true,
      },
      longitude: {
         type: Number,
         required: true,
      },
      location: {
         type: postalCodeLocationSchema,
         required: true,
      },
      objectId: {
         type: String,
         trim: true,
      },
   },
   {
      timestamps: true,
      versionKey: false,
   },
);

// Geospatial index for 2dsphere proximity & radius search
postalCodeSchema.index({
   location: "2dsphere",
});

// Compound index for fast postal code & city queries
postalCodeSchema.index({
   postalCode: 1,
   placeName: 1,
});

// Text index for full-text search across German cities and states
postalCodeSchema.index({
   postalCode: "text",
   placeName: "text",
   adminName: "text",
});

export const PostalCode = model<IPostalCodeDoc>("PostalCode", postalCodeSchema);
