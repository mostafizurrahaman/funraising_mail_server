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

router.get(
   "/all/:companyId",
   validateRequest(SurchargeValidationSchema.getAllSurchargeByCompanyId),
   SurchargeController.getAllSurchargeByCompanyId,
);

router.delete(
   "/:id",
   auth(AuthRole.COMPANY),
   validateRequest(SurchargeValidationSchema.deleteSurchargeSchema),
   SurchargeController.deleteSurchargeById,
);

export const SurchargeRoutes = router;
