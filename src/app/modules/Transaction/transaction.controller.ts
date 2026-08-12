import httpStatus from "http-status";
import { catchAsync, sendResponse } from "../../utils";
import { TransactionServices } from "./transaction.services";

const create = catchAsync(async (req, res) => {
   const payload = req.body;

   await TransactionServices.createIntoDB(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Transaction created successfully!",
      data: null,
   });
});

export const TransactionController = {
   create,
};
