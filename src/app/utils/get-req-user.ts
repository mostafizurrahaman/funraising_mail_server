/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Request } from "express";
import type { IJwtUserPayload } from "../types/jwt.types";

export const getUserFromRequest = (req: Request) => {
   const user = req.user;

   return user;
};
