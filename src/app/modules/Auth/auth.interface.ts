import type { Document, Model } from "mongoose";
import type { AuthRole, AuthStatus } from "./auth.constant";
import { extend } from "zod/mini";

export type TAuthRole = (typeof AuthRole)[keyof typeof AuthRole];

export type TAuthStatus = (typeof AuthStatus)[keyof typeof AuthStatus];

export interface IAuth {
   name: string;
   email: string;
   phone?: string;
   profileImage?: string;
   isVerified?: boolean;
   status: TAuthStatus;
   role: TAuthRole;
   passwordHash: string;
}

export interface IAuthDoc extends IAuth, Document {}

export interface IAuthModel extends Model<IAuthDoc> {
   isTokenStale: (
      passwordChangedAt: Date,
      jwtIssuedTimestamp: number,
   ) => Promise<boolean>;
}
