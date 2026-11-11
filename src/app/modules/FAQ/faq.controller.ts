import httpStatus from "http-status";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { FAQServices } from "./faq.services";

const createFAQ = catchAsync(async (req, res) => {
   const result = await FAQServices.createFAQ(req.body);

   sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "FAQ created successfully!",
      data: result,
   });
});

const getAllFAQs = catchAsync(async (req, res) => {
   const result = await FAQServices.getAllFAQs(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "FAQs retrieved successfully!",
      data: result,
   });
});

const getSingleFAQ = catchAsync(async (req, res) => {
   const { id } = req.params;
   const result = await FAQServices.getSingleFAQ(id as string);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "FAQ retrieved successfully!",
      data: result,
   });
});

const updateFAQ = catchAsync(async (req, res) => {
   const { id } = req.params;
   const result = await FAQServices.updateFAQ(id as string, req.body);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "FAQ updated successfully!",
      data: result,
   });
});

const deleteFAQ = catchAsync(async (req, res) => {
   const { id } = req.params;
   const result = await FAQServices.deleteFAQ(id as string);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "FAQ deleted successfully!",
      data: result,
   });
});

export const FAQController = {
   createFAQ,
   getAllFAQs,
   getSingleFAQ,
   updateFAQ,
   deleteFAQ,
};

