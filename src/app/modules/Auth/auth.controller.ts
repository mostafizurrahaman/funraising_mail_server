import {
   catchAsync,
   getUserFromRequest,
   sendResponse,
   setCookie,
} from "../../utils";
import httpStatus from "http-status";
import { AppError } from "../../errors";
import { AuthServices } from "./auth.services";
import { TMulterFile } from "@/app/types/multer.types";

interface ISignUpFiles {
   profileImage: TMulterFile[];
   documents: TMulterFile[];
}

// 1. Signup (Owner)
const signUp = catchAsync(async (req, res) => {
   const payload = req.body;
   console.log(req.files);
   const files = req.files as unknown as ISignUpFiles;
   const profileImage = files?.profileImage?.[0] as TMulterFile;
   const documents = files?.documents as TMulterFile[];

   console.log({
      documents,
   });

   const result = await AuthServices.signupIntoDB(
      payload,
      profileImage,
      documents,
   );

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message:
         "Account created successfully. Please check your email to verify your account.",
      data: result,
   });
});

// ? Organization Login:
const organizationLogin = catchAsync(async (req, res) => {
   const payload = req.body;

   const result = await AuthServices.organizationLogin(payload);

   setCookie(res, "refreshToken", result.refreshToken, {
      httpOnly: false,
      secure: true,
      maxAge: 60 * 60 * 24 * 1000 * 365,
      sameSite: "none",
      path: "/",
   });

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Organization logged in successfully!",
      data: result,
   });
});

const adminLogin = catchAsync(async (req, res) => {
   const payload = req.body;

   const result = await AuthServices.adminLogin(payload);

   setCookie(res, "refreshToken", result.refreshToken, {
      httpOnly: false,
      secure: true,
      maxAge: 60 * 60 * 24 * 1000 * 365,
      sameSite: "none",
      path: "/",
   });

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Admin logged in successfully!",
      data: result,
   });
});

const driverLogin = catchAsync(async (req, res) => {
   const payload = req.body;

   const result = await AuthServices.driverLogin(payload);

   setCookie(res, "refreshToken", result.refreshToken, {
      httpOnly: false,
      secure: true,
      maxAge: 60 * 60 * 24 * 1000 * 365,
      sameSite: "none",
      path: "/",
   });

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Driver logged in successfully!",
      data: result,
   });
});

// ?? Get my profile:
const getMe = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);

   const result = await AuthServices.getProfileFromDB(user);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile retrieved successfully!",
      data: result,
   });
});

// ?? Logout
const logout = catchAsync(async (req, res) => {
   res.clearCookie("refreshToken", {
      httpOnly: false,
      secure: true,
      sameSite: "none",
      path: "/",
   });

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Logged out successfully!",
      data: null,
   });
});

// ?? Verify Email
const verifyEmail = catchAsync(async (req, res) => {
   const { token } = req.body;

   if (!token) {
      throw new AppError(httpStatus.BAD_REQUEST, "Token is required");
   }

   const result = await AuthServices.verifyEmail(token);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Email verified successfully!",
      data: result,
   });
});

// ?? Resend Verification Email
const resendVerificationEmail = catchAsync(async (req, res) => {
   const { email } = req.body;

   if (!email) {
      throw new AppError(httpStatus.BAD_REQUEST, "Email is required");
   }

   const result = await AuthServices.resendVerificationEmail(email);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Verification email resent successfully!",
      data: result,
   });
});

const forgetPassword = catchAsync(async (req, res) => {
   const payload = req.body;
   await AuthServices.forgetPassword(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password reset link sent to your email successfully!",
      data: null,
   });
});

const resetPassword = catchAsync(async (req, res) => {
   const payload = req.body;
   await AuthServices.resetPassword(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password reset successfully!",
      data: null,
   });
});

const updateProfile = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const payload = req.body;
   const files = req.files as unknown as { profileImage?: TMulterFile[] };
   const profileImage = files?.profileImage?.[0] as TMulterFile | undefined;

   const result = await AuthServices.updateProfile(user, payload, profileImage);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Profile updated successfully!",
      data: result,
   });
});

const updatePassword = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const payload = req.body;

   await AuthServices.updatePassword(user, payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Password updated successfully!",
      data: null,
   });
});

export const AuthController = {
   signUp,
   organizationLogin,
   adminLogin,
   driverLogin,
   getMe,
   logout,
   verifyEmail,
   resendVerificationEmail,
   forgetPassword,
   resetPassword,
   updateProfile,
   updatePassword,
};
