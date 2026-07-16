import { Router } from "express";
import { BookingController } from "./booking.controller";

const router = Router();

router.post("/", BookingController.create);

export const BookingRoutes = router;
