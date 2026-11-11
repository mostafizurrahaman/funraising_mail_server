import express from "express";
import { ContentController } from "./content.controller";
import { ContentValidation } from "./content.validation";
import { validateRequest } from "../../middlewares";
import { auth } from "../../middlewares/auth";
import { AuthRole } from "../Auth/auth.constant";

const router = express.Router();

router.get("/", ContentController.getAllContents);
router.get("/:type", ContentController.getContentByType);

router.post(
   "/",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   validateRequest(ContentValidation.setContentSchema),
   ContentController.upsertContent,
);

router.put(
   "/:type",
   auth(AuthRole.ADMIN, AuthRole.SUPER_ADMIN),
   validateRequest(ContentValidation.setContentSchema),
   ContentController.upsertContent,
);

export const ContentRoutes = router;

