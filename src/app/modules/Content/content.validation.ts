import z from "zod";

const setContentSchema = z.object({
   body: z.object({
      type: z.enum(["terms", "privacy", "impressum"]),
      title: z.string().min(2),
      content: z.string().min(10),
   }),
});

export const ContentValidation = {
   setContentSchema,
};

