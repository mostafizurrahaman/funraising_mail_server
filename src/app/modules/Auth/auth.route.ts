import { multerFactory } from "@/app/utils/multer";
import express from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "@/app/middlewares";
import { AuthValidationSchema } from "./auth.validation";

const router = express.Router();

router.post(
   "/organization-signup",
   multerFactory({
      category: "image",
      maxSizeInMB: 10,
   }).single("profileImage"),
   validateRequest(AuthValidationSchema.signupSchema),
   AuthController.signUp,
);

export const authRoutes = router;
