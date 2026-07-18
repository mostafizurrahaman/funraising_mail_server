// Owner signup schema :

import { GERMANY_PHONE_NUMBER_REGEX } from "@/app/constants";
// @ts-ignore
import { validationLatitudeLongitude } from "validation-latitude-longitude";
import {
   optionalString,
   positiveNumber,
   requiredEmail,
   requiredString,
} from "@/app/utils";
import z from "zod";

const signupSchema = z.object({
   body: z
      .object({
         name: requiredString("Name"),
         email: requiredEmail("Email"),
         password: requiredString("Password"),
         phone: z
            .string({
               error: `phone number should be  string!`,
            })
            .regex(GERMANY_PHONE_NUMBER_REGEX, {
               error: "Phone number is invalid!",
            }),
         companyName: requiredString("Company Name").min(3, {
            error: "Min. 3 character required!",
         }),
         city: requiredString("City"),
         address: requiredString("Address!"),
         latitude: z.coerce
            .number({
               error: "Latitude must be a number",
            })
            .min(-90, "Latitude must be greater than or equal to -90")
            .max(90, "Latitude must be less than or equal to 90"),
         longitude: z.coerce
            .number({
               error: "Longitude must be a number",
            })
            .min(-180, "Longitude must be greater than or equal to -180")
            .max(180, "Longitude must be less than or equal to 180"),
         radiusKm: z.coerce
            .number({
               error: (issue) => {
                  if (issue.input === undefined) {
                     return "Radius is required.";
                  }

                  return "Radius must be a number in kilometers.";
               },
            })
            .positive("Radius must be greater than 0 km."),
         fleetSize: positiveNumber("Fleet size"),
         note: optionalString("Note"),
      })
      .superRefine((data, ctx) => {
         if (
            data.latitude &&
            !validationLatitudeLongitude.latitude(data.latitude)
         ) {
            return ctx.addIssue({
               code: "custom",
               message: "Provide a valid service area.",
               path: ["address"],
            });
         }

         if (
            data.latitude &&
            !validationLatitudeLongitude.longitude(data.longitude)
         ) {
            return ctx.addIssue({
               code: "custom",
               message: "Provide a valid service area.",
               path: ["address"],
            });
         }

         if (
            data.latitude &&
            !validationLatitudeLongitude.latLong(data.latitude, data.longitude)
         ) {
            return ctx.addIssue({
               code: "custom",
               message: "Provide a valid service area.",
               path: ["address"],
            });
         }
      }),
});

export const AuthValidationSchema = {
   signupSchema,
};

export type TSignupPayload = z.infer<typeof signupSchema.shape.body>;
