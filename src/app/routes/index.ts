import { authRoutes } from "../modules/Auth/auth.route";

import express from "express";
const router = express.Router();

const routes = [
   {
      path: "/auth",
      route: authRoutes,
   },
];

routes.forEach((route) => router.use(route.path, route.route));

export const allRoutes = router;
