import { Router } from "express";
import { TrackingStateController } from "./tracking-state.controller";

const router = Router();

router.post("/", TrackingStateController.create);

export const TrackingStateRoutes = router;
