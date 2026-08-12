import httpStatus from "http-status";
import { catchAsync } from "@/app/utils/catch-async";
import { sendResponse } from "@/app/utils/send-response";
import { AdminServices } from "./admin.services";
import { getUserFromRequest } from "@/app/utils";

const getAllCompanies = catchAsync(async (req, res) => {
   const result = await AdminServices.getAllCompanies(req.query);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Companies fetched successfully!",
      data: result,
   });
});

const updateCompanyStatus = catchAsync(async (req, res) => {
   const { id } = req.params;
   const result = await AdminServices.updateCompanyStatus(
      id as string,
      req.body,
   );

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Company status updated successfully!",
      data: result,
   });
});

const deleteCompany = catchAsync(async (req, res) => {
   const { id } = req.params;
   const result = await AdminServices.deleteCompany(id as string);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Company deleted successfully!",
      data: result,
   });
});

const getAdminOverview = catchAsync(async (_req, res) => {
   const result = await AdminServices.getAdminOverview();

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Admin overview fetched successfully!",
      data: result,
   });
});

const getCompanyOverview = catchAsync(async (req, res) => {
   const user = getUserFromRequest(req);
   const result = await AdminServices.getCompanyOverview(user?._id?.toString());

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Company overview fetched successfully!",
      data: result,
   });
});

export const AdminController = {
   getAllCompanies,
   updateCompanyStatus,
   deleteCompany,
   getAdminOverview,
   getCompanyOverview,
};
