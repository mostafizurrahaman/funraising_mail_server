import httpStatus from "http-status";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { SupportServices } from "./support.services";

const createSupportMessage = catchAsync(async (req, res) => {
   const result = await SupportServices.createSupportMessage(req.body);

   sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Support message submitted successfully!",
      data: result,
   });
});

const getAllSupportMessages = catchAsync(async (req, res) => {
   const result = await SupportServices.getAllSupportMessages(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Support messages retrieved successfully!",
      meta: result.meta,
      data: result.data,
   });
});

const updateSupportMessage = catchAsync(async (req, res) => {
   const { id } = req.params;
   const result = await SupportServices.updateSupportMessage(
      id as string,
      req.body,
   );

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Support message updated successfully!",
      data: result,
   });
});

const deleteSupportMessage = catchAsync(async (req, res) => {
   const { id } = req.params;
   const result = await SupportServices.deleteSupportMessage(id as string);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Support message deleted successfully!",
      data: result,
   });
});

export const SupportController = {
   createSupportMessage,
   getAllSupportMessages,
   updateSupportMessage,
   deleteSupportMessage,
};

