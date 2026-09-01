import { Document, Types } from "mongoose";
import type { geoLocationType } from "./company.constants";

export type TGeoLocationType =
   (typeof geoLocationType)[keyof typeof geoLocationType];

export interface IGeoJSONPoint {
   type: TGeoLocationType;
   coordinates: [number, number]; // [Longitude, Latitude]
}

interface ICompany {
   user: Types.ObjectId;
   companyName: string;
   companyCode: string;
   /**
    * URL-safe, normalized identifier derived from companyName + postalCode.
    * Format: "medride-transports-gmbh--10115"
    * Used as the unique deduplication key for organizations.
    */
   slug: string;
   city: string;
   address?: string;
   serviceArea: IGeoJSONPoint;
   fleetSize: number;
   postalCode?: string;
   radiusKm: number;
   note?: string;
   documents: string[];
}

export interface ICompanyDoc extends ICompany, Document {}
