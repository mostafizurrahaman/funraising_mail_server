import { Router } from "express";
import { GlobalSurchargeController } from "./globalSurcharge.controller";
import { validateRequest } from "../../middlewares";
import { GlobalSurchargeValidation } from "./globalSurcharge.validation";
import { AuthRole } from "../Auth/auth.constant";
import { auth } from "../../middlewares/auth";

const router = Router();

// Only admin can manage global surcharges
router.post(
   "/",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   validateRequest(GlobalSurchargeValidation.createGlobalSurchargeZodSchema),
   GlobalSurchargeController.createGlobalSurcharge,
);

// Companies and Admins can view them
router.get(
   "/",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN, AuthRole.COMPANY),
   GlobalSurchargeController.getAllGlobalSurcharges,
);

router.patch(
   "/:id",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   validateRequest(GlobalSurchargeValidation.updateGlobalSurchargeZodSchema),
   GlobalSurchargeController.updateGlobalSurchargeById,
);

router.delete(
   "/:id",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   GlobalSurchargeController.deleteGlobalSurchargeById,
);

export const GlobalSurchargeRoutes = router;
