import { Router } from "express";
import { DriverController } from "./driver.controller";
import { auth } from "@/app/middlewares/auth";
import { AuthRole } from "../Auth/auth.constant";
import { multerFactory } from "@/app/utils/multer";
import { validateRequest } from "@/app/middlewares";
import { AuthValidationSchema } from "../Auth/auth.validation";
import { DriverValidationSchema } from "./driver.validation";

const router = Router();

router.post(
   "/",
   multerFactory({
      category: "image",
      maxSizeInMB: 10,
   }).single("profileImage"),
   auth(AuthRole.COMPANY),
   validateRequest(DriverValidationSchema.createSchema),
   DriverController.createDriver,
);

export const DriverRoutes = router;
