import { Router } from "express";
import { SurchargeController } from "./surcharge.controller";

const router = Router();

router.post("/", SurchargeController.create);

export const SurchargeRoutes = router;
