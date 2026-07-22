import {
   enumString,
   optionalEnumString,
   optionalString,
   requiredString,
} from "@/app/utils";
import z from "zod";
import { CountryValues, CurrencyValues } from "./bank.constant";

const createSchema = z.object({
   body: z.object({
      bankName: requiredString("Bank Name"),
      accountHolder: requiredString("Account Holder"),
      iban: requiredString("IBAN"),
      bic: requiredString("BIC"),
      country: enumString(CountryValues, "Country").default("Germany"),
      currency: enumString(CurrencyValues, "Currency").default("eur"),
   }),
});

const updateSchema = z.object({
   body: z.object({
      bankName: optionalString("Bank Name"),
      accountHolder: optionalString("Account Holder"),
      iban: optionalString("IBAN"),
      bic: optionalString("BIC"),
      country: optionalEnumString(CountryValues, "Country"),
      currency: optionalEnumString(CurrencyValues, "Currency"),
   }),
});

export const BankValidationSchema = {
   createSchema,
   updateSchema,
};

export type TCreateBankPayload = z.infer<typeof createSchema.shape.body>;
export type TUpdateBankPayload = z.infer<typeof updateSchema.shape.body>;
