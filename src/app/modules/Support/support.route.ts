import express from "express";
import { SupportController } from "./support.controller";
import { SupportValidation } from "./support.validation";
import { validateRequest } from "../../middlewares";
import { auth } from "../../middlewares/auth";
import { AuthRole } from "../Auth/auth.constant";

const router = express.Router();

// Public route: submit a contact/support message
router.post(
   "/",
   validateRequest(SupportValidation.createSupportSchema),
   SupportController.createSupportMessage,
);

// Admin routes: view, update, and delete support messages
router.get(
   "/",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   SupportController.getAllSupportMessages,
);

router.patch(
   "/:id",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   validateRequest(SupportValidation.updateSupportSchema),
   SupportController.updateSupportMessage,
);

router.delete(
   "/:id",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   SupportController.deleteSupportMessage,
);

export const SupportRoutes = router;

