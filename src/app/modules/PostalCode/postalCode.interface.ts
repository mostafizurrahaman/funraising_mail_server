import { Document } from "mongoose";
import { IGeoJSONPoint } from "../Company/company.interface";

export interface IPostalCode {
   countryCode: string;
   postalCode: string; // 5-digit formatted string, e.g. "06667", "40212"
   placeName: string;  // City or municipality, e.g. "Düsseldorf"
   adminName: string;  // Bundesland / State, e.g. "Nordrhein-Westfalen"
   adminCode?: string; // State code, e.g. "NW", "BY"
   slug: string;       // Unique URL slug, e.g. "40212-duesseldorf"
   latitude: number;
   longitude: number;
   location: IGeoJSONPoint;
   objectId?: string;
}

export interface IPostalCodeDoc extends IPostalCode, Document {}
