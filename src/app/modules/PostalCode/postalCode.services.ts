import fs from "fs";
import path from "path";
import httpStatus from "http-status";
import { AppError } from "../../errors";
import { PostalCode } from "./postalCode.model";
import { Company } from "../Company/company.model";
import { geoLocationType } from "../Company/company.constants";

export const generatePostalCodeSlug = (
   postalCode: string | number,
   placeName: string,
): string => {
   const normalizedPlz = String(postalCode).trim().padStart(5, "0");
   const normalizedPlace = placeName
      .toLowerCase()
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

   return `${normalizedPlz}-${normalizedPlace}`;
};

const getAllPostalCodes = async (query?: {
   searchTerm?: string;
   adminCode?: string;
   adminName?: string;
   page?: number | string;
   limit?: number | string;
   sortBy?: string;
   sortOrder?: string;
}) => {
   const page = Math.max(Number(query?.page) || 1, 1);
   const limit = Math.max(Number(query?.limit) || 20, 1);
   const skip = (page - 1) * limit;

   const allowedSortFields = [
      "postalCode",
      "placeName",
      "adminName",
      "adminCode",
      "createdAt",
   ];
   const sortBy =
      query?.sortBy && allowedSortFields.includes(query.sortBy)
         ? query.sortBy
         : "postalCode";
   const sortOrder = query?.sortOrder === "desc" ? -1 : 1;

   const filter: Record<string, any> = {};

   if (query?.adminCode && query.adminCode !== "all") {
      filter.adminCode = query.adminCode.toUpperCase();
   }

   if (query?.adminName && query.adminName !== "all") {
      filter.adminName = query.adminName;
   }

   if (query?.searchTerm) {
      const term = query.searchTerm.trim();
      filter.$or = [
         { postalCode: { $regex: term, $options: "i" } },
         { placeName: { $regex: term, $options: "i" } },
         { adminName: { $regex: term, $options: "i" } },
      ];
   }

   const [data, total] = await Promise.all([
      PostalCode.find(filter)
         .sort({ [sortBy]: sortOrder })
         .skip(skip)
         .limit(limit)
         .lean(),
      PostalCode.countDocuments(filter),
   ]);

   return {
      meta: {
         page,
         limit,
         total,
         totalPages: Math.ceil(total / limit),
      },
      data,
   };
};

const getPostalCodeByCodeOrSlug = async (codeOrSlug: string) => {
   const normalized = codeOrSlug.trim().toLowerCase();

   // Find either by exact slug, or by 5-digit padded postal code
   const postalCodeDoc = await PostalCode.findOne({
      $or: [
         { slug: normalized },
         { postalCode: normalized.padStart(5, "0") },
         { postalCode: normalized },
      ],
   }).lean();

   if (!postalCodeDoc) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         `German postal code / location "${codeOrSlug}" not found.`,
      );
   }

   // 1. Direct match: Companies located directly in this postal code
   const directCompanies = await Company.find({
      postalCode: postalCodeDoc.postalCode,
   })
      .populate("user", "name email phone photo")
      .lean();

   // 2. Geospatial Proximity Match ($nearSphere): Companies within 50km radius
   let nearbyCompanies: any[] = [];
   try {
      nearbyCompanies = await Company.find({
         serviceArea: {
            $nearSphere: {
               $geometry: postalCodeDoc.location,
               $maxDistance: 50 * 1000, // 50 km in meters
            },
         },
      })
         .populate("user", "name email phone photo")
         .limit(15)
         .lean();
   } catch {
      // If 2dsphere search has any index edge case, fallback to direct
      nearbyCompanies = [];
   }

   // Merge and deduplicate companies by _id
   const companyMap = new Map<string, any>();
   for (const comp of directCompanies) {
      companyMap.set(String(comp._id), { ...comp, isDirectMatch: true });
   }
   for (const comp of nearbyCompanies) {
      if (!companyMap.has(String(comp._id))) {
         companyMap.set(String(comp._id), { ...comp, isDirectMatch: false });
      }
   }

   return {
      postalCode: postalCodeDoc,
      companies: Array.from(companyMap.values()),
   };
};

const getAllPostalCodeList = async () => {
   const uniquePlzs = await PostalCode.distinct("postalCode");
   return uniquePlzs;
};

export const GERMAN_REGIONS_MAP: Record<string, string> = {
   "baden-wuerttemberg": "Baden-Württemberg",
   "bayern": "Bayern",
   "berlin": "Berlin",
   "brandenburg": "Brandenburg",
   "bremen": "Bremen",
   "hamburg": "Hamburg",
   "hessen": "Hessen",
   "mecklenburg-vorpommern": "Mecklenburg-Vorpommern",
   "niedersachsen": "Niedersachsen",
   "nordrhein-westfalen": "Nordrhein-Westfalen",
   "rheinland-pfalz": "Rheinland-Pfalz",
   "saarland": "Saarland",
   "sachsen": "Sachsen",
   "sachsen-anhalt": "Sachsen-Anhalt",
   "schleswig-holstein": "Schleswig-Holstein",
   "thueringen": "Thüringen",
};

const getPostalCodesByRegionSlug = async (regionSlug: string) => {
   const normalizedSlug = regionSlug.toLowerCase().trim();
   const adminName = GERMAN_REGIONS_MAP[normalizedSlug];

   const filter: Record<string, any> = {};
   if (adminName) {
      filter.adminName = adminName;
   } else {
      filter.$or = [
         { adminName: { $regex: new RegExp(`^${normalizedSlug}`, "i") } },
         { adminCode: normalizedSlug.toUpperCase() },
      ];
   }

   const docs = await PostalCode.find(filter)
      .select("postalCode placeName slug updatedAt")
      .sort({ postalCode: 1 })
      .lean();

   return {
      region: adminName || regionSlug,
      slug: normalizedSlug,
      count: docs.length,
      data: docs,
   };
};

const getPostalCodeStats = async () => {
   const total = await PostalCode.countDocuments();
   const uniquePlzs = await PostalCode.distinct("postalCode");
   const states = await PostalCode.aggregate([
      { $group: { _id: { adminName: "$adminName", adminCode: "$adminCode" }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
   ]);

   return {
      totalRecords: total,
      uniquePostalCodes: uniquePlzs.length,
      states: states.map((s) => ({
         name: s._id.adminName,
         code: s._id.adminCode,
         count: s.count,
      })),
   };
};

const seedPostalCodesFromJSON = async (customFilePath?: string) => {
   // Locate client JSON file
   const possiblePaths = [
      customFilePath,
      path.resolve(process.cwd(), "..", "Issues_given_by_client", "client_given_postal_codes_json.json"),
      path.resolve(process.cwd(), "Issues_given_by_client", "client_given_postal_codes_json.json"),
      path.resolve(process.cwd(), "data", "client_given_postal_codes_json.json"),
   ].filter(Boolean) as string[];

   let targetPath = "";
   for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
         targetPath = p;
         break;
      }
   }

   if (!targetPath) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "client_given_postal_codes_json.json file could not be found.",
      );
   }

   console.log(`Starting postal code seed from: ${targetPath}`);
   const fileContent = fs.readFileSync(targetPath, "utf-8");
   const parsed = JSON.parse(fileContent);
   const results = Array.isArray(parsed) ? parsed : parsed.results;

   if (!Array.isArray(results) || results.length === 0) {
      throw new AppError(
         httpStatus.BAD_REQUEST,
         "Invalid JSON format or empty results array.",
      );
   }

   const BATCH_SIZE = 2000;
   let processed = 0;
   let upsertedCount = 0;

   for (let i = 0; i < results.length; i += BATCH_SIZE) {
      const batch = results.slice(i, i + BATCH_SIZE);
      const bulkOps = batch.map((item: any) => {
         const plz = String(item.Postal_Code).trim().padStart(5, "0");
         const placeName = String(item.Place_Name || "").trim();
         const adminName = String(item.Admin_Name || "").trim();
         const adminCode = String(item.Admin_Code || "").trim().toUpperCase();
         const slug = generatePostalCodeSlug(plz, placeName);
         const latitude = Number(item.Latitude);
         const longitude = Number(item.Longitude);

         return {
            updateOne: {
               filter: { slug },
               update: {
                  $set: {
                     countryCode: item.CountryCode || "DE",
                     postalCode: plz,
                     placeName,
                     adminName,
                     adminCode,
                     slug,
                     latitude,
                     longitude,
                     location: {
                        type: geoLocationType.Point,
                        coordinates: [longitude, latitude] as [number, number],
                     },
                     objectId: item.objectId,
                  },
               },
               upsert: true,
            },
         };
      });

      const res = await PostalCode.bulkWrite(bulkOps, { ordered: false });
      upsertedCount += (res.upsertedCount || 0) + (res.modifiedCount || 0);
      processed += batch.length;
      console.log(`Processed ${processed} / ${results.length} postal codes...`);
   }

   return {
      totalFound: results.length,
      processed,
      upsertedCount,
   };
};

export const PostalCodeServices = {
   getAllPostalCodes,
   getAllPostalCodeList,
   getPostalCodesByRegionSlug,
   getPostalCodeByCodeOrSlug,
   getPostalCodeStats,
   seedPostalCodesFromJSON,
};
