import z from "zod";

const createSchema = z.object({
   body: z.object({}),
});

export const SurchargeValidationSchema = {
   createSchema,
};

export type TCreateSurchargePayload = z.infer<
   typeof createSchema.shape.body
>;
