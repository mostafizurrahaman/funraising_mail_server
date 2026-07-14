import z from "zod";

const createSchema = z.object({
   body: z.object({}),
});

export const PricingValidationSchema = {
   createSchema,
};

export type TCreatePricingPayload = z.infer<
   typeof createSchema.shape.body
>;
