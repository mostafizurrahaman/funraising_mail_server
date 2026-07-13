import type { ZodObject } from "zod";
import { catchAsync } from "../utils";

export const validateRequest = (schema: ZodObject) => {
   return catchAsync(async (req, res, next) => {
      const { data, success, error } = await schema.safeParseAsync({
         body: req.body,
         params: req.params,
         query: req.query,
         cookies: req.cookies,
      });

      if (success) {
         if (data.body) {
            req.body = data.body;
         }

         if (data.cookies) {
            req.cookies = data.cookies;
         }

         next();
      } else {
         console.log(error);
         next(error);
      }
   });
};
