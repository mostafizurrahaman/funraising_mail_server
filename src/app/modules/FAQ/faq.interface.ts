import { Document } from "mongoose";

export interface IFAQ {
   question: string;
   answer: string;
   category?: string;
   order?: number;
   isActive: boolean;
}

export type IFAQDoc = IFAQ & Document;

