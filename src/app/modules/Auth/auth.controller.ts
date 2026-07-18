import { catchAsync, sendResponse } from "@/app/utils";
import httpStatus from "http-status";
import { AuthServices } from "./auth.services";
// 1. Signup (Owner)
const signUp = catchAsync(async (req, res) => {
   const payload = req.body;
   const profileImage = req.file as Express.Multer.File;

   const result = await AuthServices.signupIntoDB(payload, profileImage);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Account created successfully!",
      data: result,
   });
});

export const AuthController = {
   signUp,
};
