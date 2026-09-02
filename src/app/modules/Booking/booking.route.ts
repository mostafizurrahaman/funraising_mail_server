import { Router } from "express";
import { BookingController } from "./booking.controller";
import { validateRequest } from "../../middlewares";
import { BookingValidationSchema } from "./booking.validation";
import { multerFactory } from "../../utils/multer";
import { auth } from "../../middlewares/auth";
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

router.get(
   "/public/:id",
   BookingController.getBookingByIdPublic,
);

router.post(
   "/:id/pay",
   validateRequest(BookingValidationSchema.payForPrivateBooking),
   BookingController.payForBookingByID,
);

router.patch(
   "/:id/verify-payment",
   auth(AuthRole.COMPANY, AuthRole.SUPER_ADMIN),
   validateRequest(BookingValidationSchema.verifyPayment),
   BookingController.verifyPayment,
);

router.patch(
   "/:id/assign-driver",
   auth(AuthRole.COMPANY),
   validateRequest(BookingValidationSchema.assignDriverByCompanySchema),
   BookingController.assignDriverByCompany,
);

router.patch(
   "/:id/unassign-driver",
   auth(AuthRole.COMPANY),
   // Use a similar param validation (ID) schema
   validateRequest(BookingValidationSchema.rejectBookingByIDSchema), 
   BookingController.unassignDriverByCompany,
);

router.patch(
   "/:id/assign-self",
   auth(AuthRole.DRIVER),
   validateRequest(BookingValidationSchema.assignDriverBySelfSchema),
   BookingController.assignBookingToSelf,
);

router.patch(
   "/:id/reject",
   auth(AuthRole.DRIVER),
   validateRequest(BookingValidationSchema.rejectBookingByIDSchema),
   BookingController.rejectTheAssignment,
);

router.patch(
   "/:id/cancel",
   auth(AuthRole.DRIVER),
   validateRequest(BookingValidationSchema.cancelRideByDriverSchema),
   BookingController.cancelRideByDriver,
);

router.patch(
   "/:id/cash-receive",
   auth(AuthRole.DRIVER),
   validateRequest(BookingValidationSchema.cashReceiveForBookingByIDSchema),
   BookingController.cashReceivedForBooking,
);

router.patch(
   "/:id/status",
   auth(AuthRole.DRIVER),
   validateRequest(BookingValidationSchema.startBookingSchema),
   BookingController.startBooking,
);

export const BookingRoutes = router;
