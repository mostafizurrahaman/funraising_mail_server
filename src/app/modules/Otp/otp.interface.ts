import type { Document, Types } from "mongoose";
import type { TOtpType } from "./opt.constant";

export interface IOtp {
   user: Types.ObjectId;
   otp: string;
   type: TOtpType;
   expiresAt: Date;
}

export interface IOtpDoc extends IOtp, Document {}
