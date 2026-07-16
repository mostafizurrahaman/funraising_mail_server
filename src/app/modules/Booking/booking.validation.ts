import z from "zod";

const createSchema = z.object({
   body: z.object({}),
});

export const BookingValidationSchema = {
   createSchema,
};

export type TCreateBookingPayload = z.infer<
   typeof createSchema.shape.body
>;
