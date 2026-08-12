import { requiredMongooseId } from "@/app/utils";
import z from "zod";
import { InvoiceStatusValues } from "./invoice.constant";

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

const updateStatusSchema = z.object({
   body: z.object({
      status: z.enum(InvoiceStatusValues as [string, ...string[]]),
   }),
});

export const InvoiceValidationSchema = {
   createSchema,
   updateStatusSchema,
};

export type TCreateInvoicePayload = z.infer<typeof createSchema.shape.body>;
export type TUpdateInvoiceStatusPayload = z.infer<typeof updateStatusSchema.shape.body>;
