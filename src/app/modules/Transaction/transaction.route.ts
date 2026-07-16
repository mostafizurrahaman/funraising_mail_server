import { Router } from "express";
import { TransactionController } from "./transaction.controller";

const router = Router();

router.post("/", TransactionController.create);

export const TransactionRoutes = router;
