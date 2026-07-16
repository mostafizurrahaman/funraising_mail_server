import z from "zod";

const createSchema = z.object({
   body: z.object({}),
});

export const TrackingStateValidationSchema = {
   createSchema,
};

export type TCreateTrackingStatePayload = z.infer<
   typeof createSchema.shape.body
>;
