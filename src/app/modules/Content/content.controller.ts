import httpStatus from "http-status";
import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { ContentServices } from "./content.services";
import { getUserFromRequest } from "../../utils";
import type { ContentType } from "./content.interface";

const upsertContent = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const result = await ContentServices.upsertContent({
      ...req.body,
      updatedBy: user?._id,
   });

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `${req.body.type} content updated successfully!`,
      data: result,
   });
});

const getContentByType = catchAsync(async (req, res) => {
   const { type } = req.params;
   const result = await ContentServices.getContentByType(type as ContentType);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: `${type} content retrieved successfully!`,
      data: result,
   });
});

const getAllContents = catchAsync(async (_req, res) => {
   const result = await ContentServices.getAllContents();

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Contents retrieved successfully!",
      data: result,
   });
});

export const ContentController = {
   upsertContent,
   getContentByType,
   getAllContents,
};

