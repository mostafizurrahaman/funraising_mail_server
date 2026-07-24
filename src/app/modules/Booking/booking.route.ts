import { Router } from "express";
import { BookingController } from "./booking.controller";
import { validateRequest } from "@/app/middlewares";
import { BookingValidationSchema } from "./booking.validation";
import { multerFactory } from "@/app/utils/multer";

const router = Router();

router.post(
   "/gkb",
   multerFactory({
      allowedExtensions: ["pdf", "doc", "docx", "jpeg", "png", "jpg"],
      maxSizeInMB: 50,
   }).array("prescriptionFiles", 5),
   validateRequest(BookingValidationSchema.gkvBookingCreateSchema),
   BookingController.createGkbBooking,
);

router.post(
   "/private",
   validateRequest(BookingValidationSchema.privateBookingCreateSchema),
   BookingController.createPrivateBooking,
);

export const BookingRoutes = router;
