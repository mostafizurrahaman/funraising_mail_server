import z from "zod";

const createSchema = z.object({
   body: z.object({}),
});

export const InvoiceValidationSchema = {
   createSchema,
};

export type TCreateInvoicePayload = z.infer<
   typeof createSchema.shape.body
>;
