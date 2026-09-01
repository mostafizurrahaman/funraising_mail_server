/* eslint-disable @typescript-eslint/no-explicit-any */

import type { IErrorSources, ISendErrorResponse } from "../types";
import httpStatus from "http-status";

export const handleDuplicateError = (err: any): ISendErrorResponse => {
   const keys = Object.keys(err.keyPattern);
   let message = "";
   let path = keys[0] as string;

   if (keys.includes("user") && keys.includes("globalSurcharge")) {
      message = "This surcharge is already added to your company.";
      path = "globalSurcharge";
   } else if (keys.length > 1) {
      message = `This combination of ${keys.join(" and ")} already exists.`;
      path = keys.join("_");
   } else {
      message = `The ${path} '${err.keyValue[path]}' already exists.`;
   }

   const errorSources: IErrorSources[] = [
      {
         path,
         message,
      },
   ];
   const statusCode: number = httpStatus.BAD_REQUEST;

   return {
      statusCode,
      message: errorSources?.[0]?.message as string,
      errorSources,
   };
};
