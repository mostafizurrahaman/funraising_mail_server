import {
   GERMANY_PHONE_NUMBER_REGEX,
   sortingOrderValues,
   sortOrder,
} from "@/app/constants";
import {
   enumString,
   optionalDate,
   optionalEnumString,
   optionalNumber,
   optionalString,
   requiredEmail,
   requiredString,
} from "@/app/utils";
import z from "zod";
import { driverSortableFields } from "./driver.constant";
import { AuthStatus, AuthStatusValues } from "../Auth/auth.constant";

const createSchema = z.object({
   body: z.object({
      name: requiredString("name"),
      email: requiredEmail("email"),
      password: requiredString("password"),
      phone: requiredString("phone").regex(GERMANY_PHONE_NUMBER_REGEX, {
         error: "Phone number should be germany number!",
      }),
      vehicleDetails: requiredString("Vehicle details"),
   }),
});

const getAllDrivers = z.object({
   query: z.object({
      page: optionalNumber("Page").default(1),
      limit: optionalNumber("Limit").default(10),
      searchTerm: optionalString("Search term"),
      sortBy: optionalEnumString(driverSortableFields, "Sort by"),
      sortOrder: optionalEnumString(sortingOrderValues, "Sort order"),
      status: optionalEnumString(AuthStatusValues, "Status"),
      fromDate: optionalDate("From Date"),
      toDate: optionalDate("To Date"),
   }),
});

const setNewPassword = z.object({
   params: z.object({
      driverId: requiredString("Driver ID"),
   }),
   body: z.object({
      newPassword: requiredString("New password"),
   }),
});

const updateStatusSchema = z.object({
   params: z.object({
      driverId: requiredString("Driver ID"),
   }),
   body: z.object({
      status: enumString(
         [AuthStatus.ACTIVE, AuthStatus.BLOCKED, AuthStatus.REJECTED],
         "status",
      ),
   }),
});
const driverDeleteByIDSchema = z.object({
   params: z.object({
      driverId: requiredString("Driver ID"),
   }),
});

export const DriverValidationSchema = {
   createSchema,
   getAllDrivers,
   setNewPassword,
   updateStatusSchema,
   driverDeleteByIDSchema,
};

export type TCreateDriverPayload = z.infer<typeof createSchema.shape.body>;
export type TGetAllDriverQuery = z.infer<typeof getAllDrivers.shape.query>;
export type TSetNewPasswordPayloadType = z.infer<
   typeof setNewPassword.shape.body
>;
export type TUpdateStatusPayloadType = z.infer<
   typeof updateStatusSchema.shape.body
>;
export type TDriverDeleteByIdType = z.infer<
   typeof driverDeleteByIDSchema.shape.params
>;

// 3232323 (company password)
// 1234567 (admin password)
// from company what we set.
