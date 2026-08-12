import { positiveNumber } from "../../utils";
import z from "zod";

const updateOrCreateSchema = z.object({
   body: z.object({
      baseFare: positiveNumber("Base fare must be a number."),
      perKm: positiveNumber("Per kilometer fare is required."),
   }),
});

export const PricingValidationSchema = {
   updateOrCreateSchema,
};

export type TUpdateOrCreatePayload = z.infer<
   typeof updateOrCreateSchema.shape.body
>;
