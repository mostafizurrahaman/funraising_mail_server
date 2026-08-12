import { multerFactory } from "../../utils/multer";
import express from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middlewares";
import { AuthValidationSchema } from "./auth.validation";
import { Auth } from "./auth.model";
import { AuthRole } from "./auth.constant";
import { auth } from "../../middlewares/auth";

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

// ? Logout:
router.post("/logout", AuthController.logout);

export const authRoutes = router;
