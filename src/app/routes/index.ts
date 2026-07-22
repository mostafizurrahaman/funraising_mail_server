import { authRoutes } from "../modules/Auth/auth.route";

import express from "express";
import { DriverRoutes } from "../modules/Driver";
import { PricingRoutes } from "../modules/Pricing";
import { SurchargeRoutes } from "../modules/Surcharge";
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
];

routes.forEach((route) => router.use(route.path, route.route));

export const allRoutes = router;
