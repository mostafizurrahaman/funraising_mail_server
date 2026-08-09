import { Company } from "../Company/company.model";
import { Auth } from "../Auth/auth.model";
import httpStatus from "http-status";
import { AppError } from "@/app/errors";
import type { Types } from "mongoose";

const getAllCompanies = async (query: Record<string, unknown>) => {
   const { status, searchTerm, ...filterData } = query;
   const conditions: any[] = [];
   
   if (status) {
      conditions.push({ "user.status": status });
   }

   const data = await Company.find().populate({
      path: "user",
      match: conditions.length > 0 ? { $and: conditions } : {},
   });

   // Filter out companies whose auth doc doesn't match the populated match condition
   const filteredData = data.filter((doc) => doc.user != null);
   
   return filteredData;
};

const updateCompanyStatus = async (
   companyId: string,
   payload: { status: string },
) => {
   const company = await Company.findById(companyId);
   if (!company) {
      throw new AppError(httpStatus.NOT_FOUND, "Company not found!");
   }

   const authDoc = await Auth.findByIdAndUpdate(
      company.user,
      { status: payload.status },
      { new: true }
   );
   
   if (!authDoc) {
       throw new AppError(httpStatus.NOT_FOUND, "User associated with company not found!");
   }

   return company;
};

const deleteCompany = async (companyId: string) => {
   const company = await Company.findById(companyId);
   if (!company) {
      throw new AppError(httpStatus.NOT_FOUND, "Company not found!");
   }

   // delete both Auth and Company
   await Auth.findByIdAndDelete(company.user);
   const deletedCompany = await Company.findByIdAndDelete(companyId);

   return deletedCompany;
};

export const AdminServices = {
   getAllCompanies,
   updateCompanyStatus,
   deleteCompany,
};
