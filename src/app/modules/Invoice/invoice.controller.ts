import httpStatus from "http-status";
import { catchAsync, sendResponse } from "@/app/utils";
import { InvoiceServices } from "./invoice.services";

const create = catchAsync(async (req, res) => {
   const payload = req.body;

   await InvoiceServices.createIntoDB(payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Invoice created successfully!",
      data: null,
   });
});

export const InvoiceController = {
   create,
};
