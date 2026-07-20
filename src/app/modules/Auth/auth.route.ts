import { multerFactory } from "@/app/utils/multer";
import express from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "@/app/middlewares";
import { AuthValidationSchema } from "./auth.validation";
import { Auth } from "./auth.model";
import { AuthRole } from "./auth.constant";
import { auth } from "@/app/middlewares/auth";

const router = express.Router();

// Sign up:
router.post(
   "/organization-signup",
   multerFactory({
      category: "image",
      maxSizeInMB: 10,
   }).single("profileImage"),
   validateRequest(AuthValidationSchema.signupSchema),
   AuthController.signUp,
);

// ? Organization Login
router.post(
   "/organization-login",
   validateRequest(AuthValidationSchema.loginSchema),
   AuthController.organizationLogin,
);
// ? Admin Login
router.post(
   "/admin-login",
   validateRequest(AuthValidationSchema.loginSchema),
   AuthController.adminLogin,
);
// ? Driver Login
router.post(
   "/driver-login",
   validateRequest(AuthValidationSchema.loginSchema),
   AuthController.driverLogin,
);

// ? Get Profile:
router.get("/me", auth(), AuthController.getMe);

export const authRoutes = router;
