import { Router } from "express";
import { BookingController } from "./booking.controller";
import { validateRequest } from "@/app/middlewares";
import { BookingValidationSchema } from "./booking.validation";
import { multerFactory } from "@/app/utils/multer";
import { auth } from "@/app/middlewares/auth";
import { AuthRole } from "../Auth/auth.constant";

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
router.get(
   "/all",
   // auth(),
   validateRequest(BookingValidationSchema.getAllBookingFromDB),
   BookingController.getAllBookings,
);

router.post(
   "/:id/pay",
   validateRequest(BookingValidationSchema.payForPrivateBooking),
   BookingController.payForBookingByID,
);
router.post(
   "/:id/verify",
   auth(AuthRole.COMPANY),
   validateRequest(BookingValidationSchema.verifyPayment),
   BookingController.verifyPayment,
);

export const BookingRoutes = router;
