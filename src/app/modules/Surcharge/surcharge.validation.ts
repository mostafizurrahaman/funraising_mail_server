import {
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

export const SurchargeValidationSchema = {
   createSurchargeSchema,
   updateSurchargeSchema,
};

export type TCreateSurchargePayload = z.infer<
   typeof createSurchargeSchema.shape.body
>;
export type TUpdateSurchargePayload = z.infer<
   typeof updateSurchargeSchema.shape.body
>;
