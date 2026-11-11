import z from "zod";

const createFaqSchema = z.object({
   body: z.object({
      question: z.string({ error: "Question is required" }).min(3),
      answer: z.string({ error: "Answer is required" }).min(3),
      category: z.string().optional(),
      order: z.number().optional(),
      isActive: z.boolean().optional(),
   }),
});

const updateFaqSchema = z.object({
   body: z.object({
      question: z.string().min(3).optional(),
      answer: z.string().min(3).optional(),
      category: z.string().optional(),
      order: z.number().optional(),
      isActive: z.boolean().optional(),
   }),
});

export const FAQValidation = {
   createFaqSchema,
   updateFaqSchema,
};

