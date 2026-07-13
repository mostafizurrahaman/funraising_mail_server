import { model, Schema } from "mongoose";
import type { IAuth, IAuthDoc, IAuthModel } from "./auth.interface";
import {
   AuthRole,
   AuthRoleValues,
   AuthStatus,
   AuthStatusValues,
} from "./auth.constant";

const authSchema = new Schema<IAuthDoc, IAuthModel>(
   {
      name: {
         type: String,
         required: true,
         trim: true,
      },
      email: {
         type: String,
         required: true,
         unique: true,
         index: true,
      },

      phone: {
         type: String, //  11, 13
      },
      passwordHash: {
         type: String,
         required: true,
      },
      profileImage: {
         type: String,
      },
      role: {
         type: String,
         enum: AuthRoleValues,
         default: AuthRole.OWNER,
      },
      status: {
         type: String,
         enum: AuthStatusValues,
         default: AuthStatus.PENDING,
      },
      isVerified: {
         type: String,
         default: false,
      },
   },

   {
      timestamps: true,
      versionKey: false,
   },
);

// ? Check  is JWT token stale or expired?:
authSchema.statics.isTokenStale = function (
   passwordChangedAt: Date,
   jwtIssuedTimestamp: number,
): boolean {
   if (!passwordChangedAt) {
      return false;
   }

   // Convert to milliseconds
   const jwtIssuedTime = jwtIssuedTimestamp * 1000;

   // Compare
   return jwtIssuedTime < passwordChangedAt.getTime();
};

// ? Design the model for the AuthSchema:

export const Auth = model<IAuthDoc, IAuthModel>("Auth", authSchema);
