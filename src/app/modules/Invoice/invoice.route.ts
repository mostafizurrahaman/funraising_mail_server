import { Router } from "express";
import { InvoiceController } from "./invoice.controller";
import { AuthRole } from "../Auth/auth.constant";
import { auth } from "@/app/middlewares/auth";

const router = Router();

router.post(
   "/",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   InvoiceController.createInvoice,
);

export const InvoiceRoutes = router;
