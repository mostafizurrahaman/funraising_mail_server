import { configs } from "../configs";
import { hashPassword } from "./password";
import { AuthRole, AuthStatus } from "../modules/Auth/auth.constant";
import { Auth } from "../modules/Auth/auth.model";
import type { IAuth } from "../modules/Auth/auth.interface";

export const seedSuperAdmin = async () => {
   const payload = {
      name: configs?.superAdminName,
      email: configs?.superAdminEmail,
      phone: configs?.superAdminPhone,
      role: AuthRole?.SUPER_ADMIN,
      status: AuthStatus?.ACTIVE,
      isVerified: true,
   } as IAuth;

   // ? check is super admin exists already?:
   const superAdmin = await Auth.findOne({
      role: "super_admin",
   });

   if (superAdmin) {
      console.log("✅ Super Admin Already exists.");
      return;
   }

   payload.passwordHash = await hashPassword(
      configs?.superAdminPassword,
      Number(configs?.passwordSaltRound),
   );

   await Auth.create(payload);
   console.log("✅ Super admin seed successfully.");
};
