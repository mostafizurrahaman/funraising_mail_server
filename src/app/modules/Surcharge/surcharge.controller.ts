import httpStatus from "http-status";
import { catchAsync, getUserFromRequest, sendResponse } from "@/app/utils";
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
   await SurchargeServices.updateSurchargeIntoDBById(user, surchargeId, payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Surcharge updated successfully!",
      data: null,
   });
});

export const SurchargeController = {
   createSurcharge,
   updateSurchargeByID,
};
