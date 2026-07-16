import { Router } from "express";
import { BookingSurchargeController } from "./booking-surcharge.controller";

const router = Router();

router.post("/", BookingSurchargeController.create);

export const BookingSurchargeRoutes = router;
