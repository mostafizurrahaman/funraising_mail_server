import { Router } from "express";
import { InvoiceController } from "./invoice.controller";
import { AuthRole } from "../Auth/auth.constant";
import { auth } from "@/app/middlewares/auth";
import { validateRequest } from "@/app/middlewares/validate-request";
import { InvoiceValidationSchema } from "./invoice.validation";

const router = Router();

router.post(
   "/",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   InvoiceController.createInvoice,
);

router.get(
   "/",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   InvoiceController.getAllInvoices,
);

router.get(
   "/my-invoices",
   auth(AuthRole.COMPANY),
   InvoiceController.getCompanyInvoices,
);

router.patch(
   "/:id/status",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   validateRequest(InvoiceValidationSchema.updateStatusSchema),
   InvoiceController.updateInvoiceStatus,
);

export const InvoiceRoutes = router;
