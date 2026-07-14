import { catchAsync, sendResponse } from "@/app/utils";
import httpStatus from "http-status";
// 1. Signup (Owner)
const signUp = catchAsync(async (req, res) => {
   const payload = req.body;

   const result = await AuthServices.signupIntoDB(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Account created successfully!",
      data: null,
   });
});

export const AuthController = {
   signUp,
};
