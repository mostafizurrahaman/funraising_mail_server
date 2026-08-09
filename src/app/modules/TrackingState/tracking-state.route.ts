import { Router } from "express";
import { TrackingStateController } from "./tracking-state.controller";

const router = Router();

router.get("/:bookingId", TrackingStateController.getByBookingId);
router.post("/:bookingId/start", TrackingStateController.startTracking);
router.post("/:bookingId/pause", TrackingStateController.pauseTracking);
router.patch("/:bookingId/progress", TrackingStateController.updateProgress);
router.delete("/:bookingId", TrackingStateController.deleteTracking);

export const TrackingStateRoutes = router;
