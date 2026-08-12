import httpStatus from "http-status";
import { catchAsync, getUserFromRequest, sendResponse } from "../../utils";
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

const getAllInvoices = catchAsync(async (req, res) => {
   const query = req.query;
   const result = await InvoiceServices.getAllInvoices(query);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All invoices retrieved successfully!",
      data: result,
   });
});

const getCompanyInvoices = catchAsync(async (req, res) => {
   const query = req.query;
   const user = getUserFromRequest(req);
   const result = await InvoiceServices.getCompanyInvoices(user, query);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Company invoices retrieved successfully!",
      data: result,
   });
});

const updateInvoiceStatus = catchAsync(async (req, res) => {
   const id = req.params.id as string;
   const payload = req.body;
   const result = await InvoiceServices.updateInvoiceStatus(id, payload);

   sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Invoice status updated successfully!",
      data: result,
   });
});

export const InvoiceController = {
   createInvoice,
   getAllInvoices,
   getCompanyInvoices,
   updateInvoiceStatus,
};
