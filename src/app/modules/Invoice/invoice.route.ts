import { Router } from "express";
import { InvoiceController } from "./invoice.controller";

const router = Router();

router.post("/", InvoiceController.create);

export const InvoiceRoutes = router;
