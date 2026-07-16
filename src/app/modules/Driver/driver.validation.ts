import z from "zod";

const createSchema = z.object({
   body: z.object({}),
});

export const DriverValidationSchema = {
   createSchema,
};

export type TCreateDriverPayload = z.infer<
   typeof createSchema.shape.body
>;
