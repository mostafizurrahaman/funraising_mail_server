import express, { Router } from "express";
import { AuthRole } from "../Auth/auth.constant";
import { auth } from "@/app/middlewares/auth";

import { validateRequest } from "@/app/middlewares";
import { UserValidations } from "./user.validations";
import { userController } from "./user.controllers";

const router: Router = express.Router();

router.get(
   "/all",
   // auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   validateRequest(UserValidations.getAllUserSchema),
   userController.getAllUser,
);

router.patch(
   "/status/:userId",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   validateRequest(UserValidations.updateStatusSchema),
   userController.updateStatus,
);

router.get(
   "/:companyCode",
   validateRequest(UserValidations.getCompanyByCompanyCode),
   userController.getCompanyByCode,
);
export const userRoutes = router;
