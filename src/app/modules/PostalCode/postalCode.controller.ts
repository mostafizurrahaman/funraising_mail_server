import httpStatus from "http-status";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { PostalCodeServices } from "./postalCode.services";

const getAllPostalCodes = catchAsync(async (req, res) => {
   const result = await PostalCodeServices.getAllPostalCodes(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "German postal codes retrieved successfully!",
      meta: result.meta,
      data: result.data,
   });
});

const getAllPostalCodeList = catchAsync(async (req, res) => {
   const result = await PostalCodeServices.getAllPostalCodeList();

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All unique postal codes retrieved successfully!",
      data: result,
   });
});

const getPostalCodeByCode = catchAsync(async (req, res) => {
   const { codeOrSlug } = req.params;
   const result = await PostalCodeServices.getPostalCodeByCodeOrSlug(
      codeOrSlug as string,
   );

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Postal code details and matching providers retrieved successfully!",
      data: result,
   });
});

const getPostalCodeStats = catchAsync(async (req, res) => {
   const result = await PostalCodeServices.getPostalCodeStats();

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Postal code statistics retrieved successfully!",
      data: result,
   });
});

const seedPostalCodes = catchAsync(async (req, res) => {
   const customPath = req.body?.filePath;
   const result = await PostalCodeServices.seedPostalCodesFromJSON(customPath);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "German postal codes seeded successfully into database!",
      data: result,
   });
});

export const PostalCodeControllers = {
   getAllPostalCodes,
   getAllPostalCodeList,
   getPostalCodeByCode,
   getPostalCodeStats,
   seedPostalCodes,
};
