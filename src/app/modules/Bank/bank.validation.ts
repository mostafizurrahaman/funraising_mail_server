import z from "zod";

const createSchema = z.object({
   body: z.object({}),
});

export const BankValidationSchema = {
   createSchema,
};

export type TCreateBankPayload = z.infer<
   typeof createSchema.shape.body
>;
