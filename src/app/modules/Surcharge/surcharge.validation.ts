import {
   optionalNumber,
   optionalString,
   positiveNumber,
   requiredMongooseId,
   requiredString,
} from "@/app/utils";
import z from "zod";

const createSurchargeSchema = z.object({
   body: z.object({
      label: requiredString("Surcharge Label"),
      amount: positiveNumber("amount"),
   }),
});

const updateSurchargeSchema = z.object({
   params: z.object({
      id: requiredMongooseId("Surcharge ID"),
   }),
   body: z.object({
      label: requiredString("Surcharge Label"),
      amount: positiveNumber("amount"),
   }),
});
const deleteSurchargeSchema = z.object({
   params: z.object({
      id: requiredMongooseId("Surcharge ID"),
   }),
});

const getAllSurchargeByCompanyId = z.object({
   params: z.object({
      companyId: requiredMongooseId("Company ID"),
   }),
});

export const SurchargeValidationSchema = {
   createSurchargeSchema,
   updateSurchargeSchema,
   deleteSurchargeSchema,
   getAllSurchargeByCompanyId,
};

export type TCreateSurchargePayload = z.infer<
   typeof createSurchargeSchema.shape.body
>;
export type TUpdateSurchargePayload = z.infer<
   typeof updateSurchargeSchema.shape.body
>;

export type TGetAllCompanySurchargesByCompanyId = z.infer<
   typeof getAllSurchargeByCompanyId.shape.params
>;
