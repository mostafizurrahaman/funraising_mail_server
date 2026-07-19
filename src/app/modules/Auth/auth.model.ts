import { model, Schema } from "mongoose";
import type { IAuthDoc, IAuthModel } from "./auth.interface";
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
         select: 0,
      },
      profileImage: {
         type: String,
         default: null,
      },
      role: {
         type: String,
         enum: AuthRoleValues,
         default: AuthRole.COMPANY,
      },
      status: {
         type: String,
         enum: AuthStatusValues,
         default: AuthStatus.PENDING,
      },
      isVerified: {
         type: Boolean,
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

authSchema.post("save", function (doc, next) {
   doc.passwordHash = "";
   next();
});

authSchema.post("find", function (next) {
   next();
});

// ? Design the model for the AuthSchema:

export const Auth = model<IAuthDoc, IAuthModel>("Auth", authSchema);
