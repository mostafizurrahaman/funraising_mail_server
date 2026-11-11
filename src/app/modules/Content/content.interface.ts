import { Document, Types } from "mongoose";

export type ContentType = "terms" | "privacy" | "impressum";

export interface IContent {
   type: ContentType;
   title: string;
   content: string;
   updatedBy?: Types.ObjectId;
}

export type IContentDoc = IContent & Document;

