import {
   catchAsync,
   getUserFromRequest,
   sendResponse,
   setCookie,
} from "@/app/utils";
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

export const AuthController = {
   signUp,
   organizationLogin,
   adminLogin,
   driverLogin,
   getMe,
   logout
};
