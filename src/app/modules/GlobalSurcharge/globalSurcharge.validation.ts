import { z } from "zod";

const createGlobalSurchargeZodSchema = z.object({
   body: z.object({
      label: z.string({
         message: "label is required!",
      }),
   }),
});

const updateGlobalSurchargeZodSchema = z.object({
   body: z.object({
      label: z.string({
         message: "label is required!",
      }).optional(),
   }),
});

export type TCreateGlobalSurchargePayload = z.infer<
   typeof createGlobalSurchargeZodSchema
>["body"];
export type TUpdateGlobalSurchargePayload = z.infer<
   typeof updateGlobalSurchargeZodSchema
>["body"];

export const GlobalSurchargeValidation = {
   createGlobalSurchargeZodSchema,
   updateGlobalSurchargeZodSchema,
};
