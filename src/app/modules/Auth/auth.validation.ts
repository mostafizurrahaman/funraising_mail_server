// Owner signup schema :

import { GERMANY_PHONE_NUMBER_REGEX } from "@/app/constants";
import {
   optionalString,
   positiveNumber,
   requiredEmail,
   requiredString,
} from "@/app/utils";
import z from "zod";

const signupSchema = z.object({
   body: z.object({
      name: requiredString("Name"),
      email: requiredEmail("Email"),
      password: requiredString("Password"),
      phone: z.regex(GERMANY_PHONE_NUMBER_REGEX, {
         error: "Phone number is invalid!",
      }),
      companyName: requiredString("Company Name").min(3, {
         error: "Min. 3 character required!",
      }),
      city: requiredString("City"),
      serviceArea: requiredString("Service area!"),
      fleetSize: positiveNumber("Fleet size"),
      note: optionalString("Note"),
   }),
});

export const AuthValidationSchema = {
   signupSchema,
};

export type TSignupPayload = z.infer<typeof signupSchema.shape.body>;
