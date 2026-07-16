import { Router } from "express";
import { DriverController } from "./driver.controller";

const router = Router();

router.post("/", DriverController.create);

export const DriverRoutes = router;
