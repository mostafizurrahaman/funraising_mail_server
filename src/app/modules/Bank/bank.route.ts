import { Router } from "express";
import { BankController } from "./bank.controller";
import { auth } from "../../middlewares/auth";
import { validateRequest } from "../../middlewares";
import { BankValidationSchema } from "./bank.validation";
import { AuthRole } from "../Auth/auth.constant";

const router = Router();

// Add bank details
router.post(
   "/",
   auth(AuthRole.COMPANY),
   validateRequest(BankValidationSchema.createSchema),
   BankController.create,
);

// Update bank details
router.patch(
   "/",
   auth(AuthRole.COMPANY),
   validateRequest(BankValidationSchema.updateSchema),
   BankController.update,
);

// Get my bank details
router.get("/me", auth(AuthRole.COMPANY), BankController.getMyBank);

// Get public bank details by company ID
router.get("/company/:companyId", BankController.getPublicBankByCompanyId);

export const BankRoutes = router;
