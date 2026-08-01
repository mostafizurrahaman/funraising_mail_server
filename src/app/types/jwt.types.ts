import type { JwtPayload } from "jsonwebtoken";

export interface IJwtUserPayload extends JwtPayload {
   _id: string;
   name: string;
   email: string;
   phone: string;
   role: string;
   profileImage: string;
   status: string;
}
