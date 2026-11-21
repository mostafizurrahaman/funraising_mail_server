import express from "express";
import { PostalCodeControllers } from "./postalCode.controller";

const router = express.Router();

// GET /api/v1/postal-codes/stats - summary stats of postal codes and coverage
router.get("/stats", PostalCodeControllers.getPostalCodeStats);

// GET /api/v1/postal-codes/all-codes - all unique postal codes for sitemap & static generation
router.get("/all-codes", PostalCodeControllers.getAllPostalCodeList);

// GET /api/v1/postal-codes/by-region/:regionSlug - postal codes grouped by Bundesland / state
router.get(
   "/by-region/:regionSlug",
   PostalCodeControllers.getPostalCodesByRegion,
);

// POST /api/v1/postal-codes/seed - seed/import postal codes from JSON
router.post("/seed", PostalCodeControllers.seedPostalCodes);

// GET /api/v1/postal-codes - list all postal codes (paginated, searchable)
router.get("/", PostalCodeControllers.getAllPostalCodes);

// GET /api/v1/postal-codes/:codeOrSlug - details + nearby transport providers
router.get("/:codeOrSlug", PostalCodeControllers.getPostalCodeByCode);

export const PostalCodeRoutes = router;
