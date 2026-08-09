import httpStatus from "http-status";
import { catchAsync, getUserFromRequest, sendResponse } from "@/app/utils";
import { BankServices } from "./bank.services";

const create = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const payload = req.body;

   const result = await BankServices.createIntoDB(user, payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Bank details saved successfully!",
      data: result,
   });
});

const update = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);
   const payload = req.body;

   const result = await BankServices.updateInDB(user, payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Bank details updated successfully!",
      data: result,
   });
});

const getMyBank = catchAsync(async (req, res) => {
   const user = await getUserFromRequest(req);

   const result = await BankServices.getFromDB(user);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Bank details retrieved successfully!",
      data: result,
   });
});

const getPublicBankByCompanyId = catchAsync(async (req, res) => {
   const { companyId } = req.params;

   const result = await BankServices.getPublicBankByCompanyId(companyId as string);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Public bank details retrieved successfully!",
      data: result,
   });
});

export const BankController = {
   create,
   update,
   getMyBank,
   getPublicBankByCompanyId,
};
