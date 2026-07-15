import { Router } from "express";
import { BankController } from "./bank.controller";

const router = Router();

router.post("/", BankController.create);

export const BankRoutes = router;
