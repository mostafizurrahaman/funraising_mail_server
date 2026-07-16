import z from "zod";

const createSchema = z.object({
   body: z.object({}),
});

export const BookingSurchargeValidationSchema = {
   createSchema,
};

export type TCreateBookingSurchargePayload = z.infer<
   typeof createSchema.shape.body
>;
