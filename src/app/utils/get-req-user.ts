/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request } from "express";
import type { IJwtUserPayload } from "../types/jwt.types";
import httpStatus from 'http-status'
import { AppError } from "../errors";

export const getUserFromRequest = (req: Request) => {
   const user = req.user;

   if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
   }

   return user;
};
