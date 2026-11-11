import z from "zod";

const createSupportSchema = z.object({
   body: z.object({
      name: z.string({ error: "Name is required" }).min(2),
      email: z.string({ error: "Valid email is required" }).email(),
      phone: z.string().optional(),
      subject: z.string({ error: "Subject is required" }).min(2),
      message: z.string({ error: "Message is required" }).min(5),
   }),
});

const updateSupportSchema = z.object({
   body: z.object({
      status: z.enum(["new", "in_progress", "resolved"]).optional(),
      adminNote: z.string().optional(),
   }),
});

export const SupportValidation = {
   createSupportSchema,
   updateSupportSchema,
};

