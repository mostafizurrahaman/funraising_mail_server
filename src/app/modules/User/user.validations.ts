import {
   enumString,
   optionalDate,
   optionalEnumString,
   optionalNumber,
   optionalString,
   requiredString,
} from "@/app/utils";
import z from "zod";
import {
   AuthRoleValues,
   AuthStatus,
   AuthStatusValues,
   sortableFields,
} from "../Auth/auth.constant";
import { sortingOrderValues } from "@/app/constants";

const getAllUserSchema = z.object({
   query: z.object({
      page: optionalNumber("Page"),
      limit: optionalNumber("Limit"),
      searchTerm: optionalString("search term"),
      status: optionalEnumString(AuthStatusValues, "Status"),
      role: optionalEnumString(AuthRoleValues, "Role"),
      sortBy: optionalEnumString(sortableFields, "Sort by"),
      sortOrder: optionalEnumString(sortingOrderValues, "Sort order"),
      postalCode: optionalDate("Postal code"),
      fromDate: optionalDate("From date"),
      toDate: optionalDate("To date"),
   }),
});

const updateStatusSchema = z.object({
   params: z.object({
      userId: requiredString("User ID"),
   }),
   body: z.object({
      status: enumString(
         [AuthStatus.ACTIVE, AuthStatus.BLOCKED, AuthStatus.REJECTED],
         "status",
      ),
   }),
});
const getCompanyByCompanyCode = z.object({
   params: z.object({
      companyCode: requiredString("Company code"),
   }),
});

export const UserValidations = {
   getAllUserSchema,
   updateStatusSchema,
   getCompanyByCompanyCode,
};

export type TGetAllUserQueryType = z.infer<typeof getAllUserSchema.shape.query>;
export type TUpdateUserStatusPayloadType = z.infer<
   typeof updateStatusSchema.shape.body
>;
export type TGetCompanyByCompanyCode = z.infer<
   typeof getCompanyByCompanyCode.shape.params
>;
