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
      allowedExtensions: ["pdf", "doc", "docx", "csv", "jpeg", "jpg", "png"],
      maxSizeInMB: 10,
   }).fields([
      {
         name: "profileImage",
         maxCount: 1,
      },
      {
         name: "documents",
         maxCount: 5,
      },
   ]),
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

// ? Verify Email:
router.post("/verify-email", AuthController.verifyEmail);

// ? Resend Verification Email:
router.post(
   "/resend-verification-email",
   AuthController.resendVerificationEmail,
);

// ? Forget Password:
router.post(
   "/forget-password",
   validateRequest(AuthValidationSchema.forgetPasswordSchema),
   AuthController.forgetPassword,
);

// ? Reset Password:
router.post(
   "/reset-password",
   validateRequest(AuthValidationSchema.resetPasswordSchema),
   AuthController.resetPassword,
);

// ? Update Profile:
router.patch(
   "/update-profile",
   auth(),
   multerFactory({
      allowedExtensions: ["jpeg", "jpg", "png"],
      maxSizeInMB: 5,
   }).fields([{ name: "profileImage", maxCount: 1 }]),
   validateRequest(AuthValidationSchema.updateProfileSchema),
   AuthController.updateProfile,
);

// ? Update Password:
router.patch(
   "/update-password",
   auth(),
   validateRequest(AuthValidationSchema.updatePasswordSchema),
   AuthController.updatePassword,
);

export const authRoutes = router;
