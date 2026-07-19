import { GERMANY_PHONE_NUMBER_REGEX } from "@/app/constants";
import { requiredEmail, requiredString } from "@/app/utils";
import z from "zod";

const createSchema = z.object({
   body: z.object({
      name: requiredString("name"),
      email: requiredEmail("email"),
      password: requiredString("password"),
      phone: requiredString("phone").regex(GERMANY_PHONE_NUMBER_REGEX, {
         error: "Phone number should be germany number!",
      }),
      vehicleDetails: requiredString("Vehicle details"),
   }),
});

export const DriverValidationSchema = {
   createSchema,
};

export type TCreateDriverPayload = z.infer<typeof createSchema.shape.body>;

// 3232323 (company password)
// 1234567 (admin password)
// from company what we set.
