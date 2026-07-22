import { Router } from "express";
import { SurchargeController } from "./surcharge.controller";
import { auth } from "@/app/middlewares/auth";
import { AuthRole } from "../Auth/auth.constant";
import { validateRequest } from "@/app/middlewares";
import { SurchargeValidationSchema } from "./surcharge.validation";

const router = Router();

router.post(
   "/",
   auth(AuthRole.COMPANY),
   validateRequest(SurchargeValidationSchema.createSurchargeSchema),
   SurchargeController.createSurcharge,
);

router.patch(
   "/:id",
   auth(AuthRole.COMPANY),
   validateRequest(SurchargeValidationSchema.updateSurchargeSchema),
   SurchargeController.updateSurchargeByID,
);

export const SurchargeRoutes = router;
