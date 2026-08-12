import express from "express";
import { AdminController } from "./admin.controller";
import { auth } from "@/app/middlewares/auth";
import { AuthRole } from "../Auth/auth.constant";

const router = express.Router();

router.get("/overview", auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN), AdminController.getAdminOverview);
router.get("/company-overview", auth(AuthRole.COMPANY), AdminController.getCompanyOverview);
router.get("/companies", auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN), AdminController.getAllCompanies);
router.patch("/companies/:id/status", auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN), AdminController.updateCompanyStatus);
router.delete("/companies/:id", auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN), AdminController.deleteCompany);

export const AdminRoutes = router;
