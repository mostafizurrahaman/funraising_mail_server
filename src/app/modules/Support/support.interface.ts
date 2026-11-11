import { Document } from "mongoose";

export type SupportStatus = "new" | "in_progress" | "resolved";

export interface ISupportMessage {
   name: string;
   email: string;
   phone?: string;
   subject: string;
   message: string;
   status: SupportStatus;
   adminNote?: string;
}

export type ISupportMessageDoc = ISupportMessage & Document;

