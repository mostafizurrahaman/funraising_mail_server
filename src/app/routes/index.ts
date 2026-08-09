import { authRoutes } from "../modules/Auth/auth.route";

import express from "express";
import { DriverRoutes } from "../modules/Driver";
import { PricingRoutes } from "../modules/Pricing";
import { SurchargeRoutes } from "../modules/Surcharge";
import { BankRoutes } from "../modules/Bank";
import { userRoutes } from "../modules/User/user.routes";
import { BookingRoutes } from "../modules/Booking";
import { InvoiceRoutes } from "../modules/Invoice";
import { AdminRoutes } from "../modules/Admin";
import { TrackingStateRoutes } from "../modules/TrackingState/tracking-state.route";
import { DriverPortalRoutes } from "../modules/DriverPortal";
const router = express.Router();

const routes = [
   {
      path: "/auth",
      route: authRoutes,
   },
   {
      path: "/driver",
      route: DriverRoutes,
   },
   {
      path: "/pricing",
      route: PricingRoutes,
   },
   {
      path: "/surcharge",
      route: SurchargeRoutes,
   },
   {
      path: "/bank",
      route: BankRoutes,
   },
   {
      path: "/user",
      route: userRoutes,
   },
   {
      path: "/booking",
      route: BookingRoutes,
   },
   {
      path: "/invoice",
      route: InvoiceRoutes,
   },
   {
      path: "/admin",
      route: AdminRoutes,
   },
   {
      path: "/tracking-state",
      route: TrackingStateRoutes,
   },
   {
      path: "/driver-portal",
      route: DriverPortalRoutes,
   },
];

routes.forEach((route) => router.use(route.path, route.route));

export const allRoutes = router;
