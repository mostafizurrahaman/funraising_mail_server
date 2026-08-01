import httpStatus from "http-status";
import { catchAsync, getUserFromRequest, sendResponse } from "@/app/utils";
import { InvoiceServices } from "./invoice.services";

const createInvoice = catchAsync(async (req, res) => {
   const payload = req.body;
   const user = getUserFromRequest(req);
   const result = await InvoiceServices.createInvoice(user, payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Invoice created successfully!",
      data: result,
   });
});

export const InvoiceController = {
   createInvoice,
};
