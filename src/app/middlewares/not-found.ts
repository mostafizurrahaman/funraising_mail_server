import httpStatus from "http-status";
import { catchAsync, sendResponse } from "../utils";

export const notFound = catchAsync(async (req, res) => {
   sendResponse(res, {
      success: true,
      statusCode: httpStatus.NOT_FOUND,
      message: `API route not found!`,
      data: null,
   });
});
