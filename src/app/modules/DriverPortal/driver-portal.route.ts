import express from "express";
import { DriverPortalController } from "./driver-portal.controller";
import { auth } from "../../middlewares/auth";
import { AuthRole } from "../Auth/auth.constant";

const router = express.Router();

router.get("/overview", auth(AuthRole.DRIVER), DriverPortalController.getDriverOverview);
router.get("/available-rides", auth(AuthRole.DRIVER), DriverPortalController.getAvailableRides);
router.get("/my-rides", auth(AuthRole.DRIVER), DriverPortalController.getMyRides);
router.patch("/rides/:id/accept", auth(AuthRole.DRIVER), DriverPortalController.acceptRide);
router.patch("/rides/:id/release", auth(AuthRole.DRIVER), DriverPortalController.releaseRide);

export const DriverPortalRoutes = router;
