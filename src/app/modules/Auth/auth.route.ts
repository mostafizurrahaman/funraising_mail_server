import { multerFactory } from "@/app/utils/multer";
import express from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "@/app/middlewares";
import { AuthValidationSchema } from "./auth.validation";

const router = express.Router();

// Login Payload:
router.post(
   "/organization-signup",
   multerFactory({
      category: "image",
      maxSizeInMB: 10,
   }).single("profileImage"),
   validateRequest(AuthValidationSchema.signupSchema),
   AuthController.signUp,
);

router.post(
   "/organization-login",
   validateRequest(AuthValidationSchema.loginSchema),
   AuthController.organizationLogin,
);

export const authRoutes = router;
