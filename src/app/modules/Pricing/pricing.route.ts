import { Router } from "express";
import { PricingController } from "./pricing.controller";

const router = Router();

router.post("/", PricingController.create);

export const PricingRoutes = router;
