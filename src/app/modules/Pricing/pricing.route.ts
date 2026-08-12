import { Router } from "express";
import { PricingController } from "./pricing.controller";
import { AuthRole } from "../Auth/auth.constant";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares";
import { PricingValidationSchema } from "./pricing.validation";

const router = Router();

router.post(
   "/",
   auth(AuthRole.COMPANY),
   validateRequest(PricingValidationSchema.updateOrCreateSchema),
   PricingController.updateAndCreatePricing,
);

router.get("/", auth(AuthRole.COMPANY), PricingController.getPricingForCompany);
router.get("/company/:companyId", PricingController.getPublicPricingByCompanyId);

export const PricingRoutes = router;
