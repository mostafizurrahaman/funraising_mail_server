import httpStatus from "http-status";
import { catchAsync, getUserFromRequest, sendResponse } from "../../utils";
import { SurchargeServices } from "./surcharge.services";

const createSurcharge = catchAsync(async (req, res) => {
   const payload = req.body;
   const user = await getUserFromRequest(req);
   await SurchargeServices.createSurchargeIntoDB(user, payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Surcharge created successfully!",
      data: null,
   });
});

const updateSurchargeByID = catchAsync(async (req, res) => {
   const payload = req.body;
   const surchargeId = req.params.id as string;
   const user = await getUserFromRequest(req);
   const result = await SurchargeServices.updateSurchargeIntoDBById(
      user,
      surchargeId,
      payload,
   );

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Surcharge updated successfully!",
      data: result,
   });
});

const deleteSurchargeById = catchAsync(async (req, res) => {
   const surchargeId = req.params.id as string;
   const user = await getUserFromRequest(req);
   const result = await SurchargeServices.deleteSurchargeByIDFromDB(
      user,
      surchargeId,
   );

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Surcharge deleted successfully!",
      data: result,
   });
});

const getAllSurchargeByCompanyId = catchAsync(async (req, res) => {
   const companyId = req.params.companyId as string;
   const result = await SurchargeServices.getAllSurchargeFromDB(companyId);
   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All surcharges are retrieved successfully!",
      data: result,
   });
});

export const SurchargeController = {
   createSurcharge,
   updateSurchargeByID,
   getAllSurchargeByCompanyId,
   deleteSurchargeById,
};
