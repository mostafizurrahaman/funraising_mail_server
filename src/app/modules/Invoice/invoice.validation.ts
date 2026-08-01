import { requiredMongooseId } from "@/app/utils";
import z from "zod";

export const monthYearSchema = z
   .string()
   .regex(/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-\d{4}$/, {
      message: "Month and year must be in the format JAN-2025",
   });

const createSchema = z.object({
   body: z.object({
      companyId: requiredMongooseId("Company ID"),
      monthYear: monthYearSchema,
   }),
});

export const InvoiceValidationSchema = {
   createSchema,
};

export type TCreateInvoicePayload = z.infer<typeof createSchema.shape.body>;
