import { GERMANY_PHONE_NUMBER_REGEX } from "@/app/constants";
import { enumString, requiredMongooseId, requiredString } from "@/app/utils";
import z from "zod";
import {
   PrescriptionReasonValues,
   VehicleTypeValues,
} from "./booking.constant";

const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

const baseBookingValidation = {
   patientName: requiredString("Patient Name")
      .min(3, { message: "Patient name must be at least 3 characters long" })
      .max(200, { message: "Patient name cannot exceed 200 characters" }),
   phone: requiredString("Phone Number").regex(GERMANY_PHONE_NUMBER_REGEX, {
      message: "Phone number should be valid german number.",
   }),
   pickupAddress: requiredString("Pickup Address"),
   pickupLongitude: z.coerce
      .number({ error: "Pickup longitude is required" })
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),
   pickupLatitude: z.coerce
      .number({ error: "Pickup latitude is required" })
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90"),
   destinationAddress: requiredString("Destination Address"),
   destinationLongitude: z.coerce
      .number({ error: "Destination longitude is required" })
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),
   destinationLatitude: z.coerce
      .number({ error: "Destination latitude is required" })
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90"),
   rideDate: z.coerce.string({ error: "Ride date is required" }).refine(
      (val) => {
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         const inputDate = new Date(val);
         return inputDate >= today;
      },
      { message: "Ride date cannot be in the past" },
   ),
   rideTime: requiredString("Ride Time").regex(timeRegex, {
      message: "Ride time must be in 24-hour format (HH:MM), e.g., 14:30",
   }),
   notes: requiredString("Notes")
      .max(500, {
         message: "Notes cannot exceed 500 characters",
      })
      .optional(),
   companyId: requiredMongooseId("Company ID"),
};

const gkvBookingCreateSchema = z.object({
   body: z
      .object({
         ...baseBookingValidation,
         insuranceName: requiredString("Insurance Name"),
         insuranceNumber: requiredString("Insurance Number"),
         vehicleType: enumString(VehicleTypeValues, "Vehicle Type"),
         prescriptionReason: enumString(
            PrescriptionReasonValues,
            "Prescription reason",
         ),
      })
      .superRefine((data, ctx) => {
         // If the coordinates are identical, it is an invalid route
         if (
            data.pickupLongitude === data.destinationLongitude &&
            data.pickupLatitude === data.destinationLatitude
         ) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message:
                  "Pickup address and destination address cannot be the exact same location",
               path: ["destinationAddress"],
            });
         }
      }),
});

export const privateBookingCreateSchema = z.object({
   body: z
      .object({
         ...baseBookingValidation,
         bookingCharges: z
            .array(requiredMongooseId("Booking Surcharges ID"), {
               error: "Booking surcharges is required",
            })
            .optional(),
      })
      .superRefine((data, ctx) => {
         // If the coordinates are identical, it is an invalid route
         if (
            data.pickupLongitude === data.destinationLongitude &&
            data.pickupLatitude === data.destinationLatitude
         ) {
            ctx.addIssue({
               code: z.ZodIssueCode.custom,
               message:
                  "Pickup address and destination address cannot be the exact same location",
               path: ["destinationAddress"],
            });
         }
      }),
});

export const BookingValidationSchema = {
   gkvBookingCreateSchema,
   privateBookingCreateSchema,
};

export type TGkvBookingPayloadType = z.infer<
   typeof gkvBookingCreateSchema.shape.body
>;
export type TPrivateBookingPayloadType = z.infer<
   typeof privateBookingCreateSchema.shape.body
>;
