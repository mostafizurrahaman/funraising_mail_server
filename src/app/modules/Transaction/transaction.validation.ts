import z from "zod";

const createSchema = z.object({
   body: z.object({}),
});

export const TransactionValidationSchema = {
   createSchema,
};

export type TCreateTransactionPayload = z.infer<
   typeof createSchema.shape.body
>;
