import { catchAsync, getUserFromRequest, sendResponse } from "@/app/utils";
import httpStatus from "http-status";
import { UserServices } from "./user.services";

const getAllUser = catchAsync(async (req, res) => {
   const query = req.query;

   const result = await UserServices.getAllUserFromDB(query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All the companies  retrieved successfully",
      data: result.data,
      meta: result.meta,
   });
});

const updateStatus = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const userId = req.params.userId as string;
   console.log({
      userId,
   });

   const result = await UserServices.updateStatus(user, userId, req.body);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User status updated successfully.",
      data: result,
   });
});

export const userController = {
   getAllUser,
   updateStatus,
};
