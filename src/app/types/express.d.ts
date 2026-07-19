import type { IAuthDoc } from "../modules/Auth/auth.interface";

declare global {
   namespace Express {
      interface Request {
         user: IAuthDoc;
      }
   }
}

export {};
