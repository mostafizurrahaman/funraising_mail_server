import httpStatus from "http-status";
import { catchAsync, sendResponse } from "@/app/utils";
import { BankServices } from "./bank.services";

const create = catchAsync(async (req, res) => {
   const payload = req.body;

   await BankServices.createIntoDB(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Bank created successfully!",
      data: null,
   });
});

export const BankController = {
   create,
};
