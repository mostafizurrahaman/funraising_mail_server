import httpStatus from "http-status";
import { catchAsync } from "../../utils";
import { sendResponse } from "../../utils";
import { GlobalSurchargeServices } from "./globalSurcharge.services";

const createGlobalSurcharge = catchAsync(async (req, res) => {
   const result = await GlobalSurchargeServices.createGlobalSurcharge(req.body);

   sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Global surcharge created successfully",
      data: result,
   });
});

const getAllGlobalSurcharges = catchAsync(async (req, res) => {
   const result = await GlobalSurchargeServices.getAllGlobalSurcharges();

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Global surcharges retrieved successfully",
      data: result,
   });
});

const updateGlobalSurchargeById = catchAsync(async (req, res) => {
   const { id } = req.params;
   const result = await GlobalSurchargeServices.updateGlobalSurchargeById(id as string, req.body);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Global surcharge updated successfully",
      data: result,
   });
});

const deleteGlobalSurchargeById = catchAsync(async (req, res) => {
   const { id } = req.params;
   const result = await GlobalSurchargeServices.deleteGlobalSurchargeById(id as string);

   sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Global surcharge deleted successfully",
      data: result,
   });
});

export const GlobalSurchargeController = {
   createGlobalSurcharge,
   getAllGlobalSurcharges,
   updateGlobalSurchargeById,
   deleteGlobalSurchargeById,
};
