import express from "express";
import { FAQController } from "./faq.controller";
import { FAQValidation } from "./faq.validation";
import { validateRequest } from "../../middlewares";
import { auth } from "../../middlewares/auth";
import { AuthRole } from "../Auth/auth.constant";

const router = express.Router();

router.get("/", FAQController.getAllFAQs);
router.get("/:id", FAQController.getSingleFAQ);

router.post(
   "/",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   validateRequest(FAQValidation.createFaqSchema),
   FAQController.createFAQ,
);

router.patch(
   "/:id",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   validateRequest(FAQValidation.updateFaqSchema),
   FAQController.updateFAQ,
);

router.delete(
   "/:id",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   FAQController.deleteFAQ,
);

export const FAQRoutes = router;

