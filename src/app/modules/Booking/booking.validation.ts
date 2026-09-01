import {
   GERMANY_PHONE_NUMBER_REGEX,
   sortingOrderValues,
} from "../../constants";
import {
   enumString,
   optionalDate,
   optionalEnumString,
   optionalNumber,
   optionalString,
   requiredMongooseId,
   requiredString,
} from "../../utils";
import z from "zod";
import {
   BookingPaymentStatusValues,
   BookingStatus,
   BookingStatusValues,
   BookingType,
   BookingTypeValues,
   PaymentMethod,
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
   pickupPostalCode: optionalString("Pickup Postal Code"),
   pickupLongitude: z.coerce
      .number({ error: "Pickup longitude is required" })
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180"),
   pickupLatitude: z.coerce
      .number({ error: "Pickup latitude is required" })
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90"),
   destinationAddress: requiredString("Destination Address"),
   destinationPostalCode: optionalString("Destination Postal Code"),
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
   desiredArrivalTime: requiredString("Desired Arrival Time").regex(timeRegex, {
      message: "Desired arrival time must be in 24-hour format (HH:MM), e.g., 14:30",
   }),
   tripIntent: enumString(["ONE_WAY", "ROUND_TRIP"], "Trip Intent"),
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

const privateBookingCreateSchema = z.object({
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

const getAllBookingFromDB = z.object({
   query: z.object({
      page: optionalNumber("Page"),
      limit: optionalNumber("Limit"),
      searchTerm: optionalString("search term"),
      bookingStatus: optionalEnumString(BookingStatusValues, "Booking Status"),
      bookingNumber: optionalString("Booking number"),
      bookingId: requiredMongooseId("Booking ID").optional(),
      paymentStatus: optionalEnumString(
         BookingPaymentStatusValues,
         "Payment Status",
      ),
      bookingType: optionalEnumString(BookingTypeValues, "Booking Type"),
      sortBy: optionalEnumString(
         [
            "createdAt",
            "updatedAt",
            "bookingNumber",
            "estimatedDistance",
            "estimatedFixedPrice",
            "estimatedRidingTime",
         ],
         "Sort by",
      ),
      companyId: requiredMongooseId("Company ID").optional(),
      assignedDriverId: requiredMongooseId("Assigned Driver ID").optional(),
      sortOrder: optionalEnumString(sortingOrderValues, "Sort order"),
      fromDate: optionalDate("From date"),
      toDate: optionalDate("To date"),
   }),
});

const verifyPayment = z.object({
   params: z.object({
      id: requiredMongooseId("Booking ID"),
   }),
   body: z.object({
      referenceNumber: requiredString("Reference Number").trim(),
   }),
});
const payForPrivateBooking = z.object({
   params: z.object({
      id: requiredMongooseId("Booking ID"),
   }),
   body: z
      .object({
         paymentMethod: enumString(
            [PaymentMethod.BANK_TRANSFER, PaymentMethod.CASH],
            "Payment Method",
         ),
         referenceNumber: optionalString("Reference Number"),
      })
      .superRefine((data, ctx) => {
         if (
            data.paymentMethod === "BANK_TRANSFER" &&
            (!data.referenceNumber || data.referenceNumber?.trim() === "")
         ) {
            ctx.addIssue({
               code: "custom",
               path: ["referenceNumber"],
               message:
                  "Reference number is required while payment method is BANK_TRANSFER",
            });
         }
      }),
});

const assignDriverByCompanySchema = z.object({
   params: z.object({
      id: requiredMongooseId("Booking ID"),
   }),
   body: z.object({
      driverId: requiredString("Driver ID"),
   }),
});
const assignDriverBySelfSchema = z.object({
   params: z.object({
      id: requiredMongooseId("Booking ID"),
   }),
});
const rejectBookingByIDSchema = z.object({
   params: z.object({
      id: requiredMongooseId("Booking ID"),
   }),
});

const cancelRideByDriverSchema = z.object({
   params: z.object({
      id: requiredMongooseId("Booking ID"),
   }),
   body: z.object({
      cancelReason: requiredString("Cancel Reason"),
   }),
});

const cashReceiveForBookingByIDSchema = z.object({
   params: z.object({
      id: requiredMongooseId("Booking ID"),
   }),
});

const startBookingSchema = z.object({
   params: z.object({
      id: requiredMongooseId("Booking ID"),
   }),
   body: z.object({
      status: requiredString("Status"),
      longitude: z.coerce
         .number({
            error: "Driver's current longitude is required to start.",
         })
         .min(-180)
         .max(180),
      latitude: z.coerce
         .number({
            error: "Driver's current latitude is required to start.",
         })
         .min(-90)
         .max(90),
   }),
});

export const BookingValidationSchema = {
   gkvBookingCreateSchema,
   privateBookingCreateSchema,
   getAllBookingFromDB,
   payForPrivateBooking,
   verifyPayment,
   assignDriverByCompanySchema,
   assignDriverBySelfSchema,
   rejectBookingByIDSchema,
   cancelRideByDriverSchema,
   startBookingSchema,
   cashReceiveForBookingByIDSchema,
};

export type TGkvBookingPayloadType = z.infer<
   typeof gkvBookingCreateSchema.shape.body
>;
export type TPrivateBookingPayloadType = z.infer<
   typeof privateBookingCreateSchema.shape.body
>;
export type TGetAllBookingQuery = z.infer<
   typeof getAllBookingFromDB.shape.query
>;
export type TPayForBookingByID = z.infer<
   typeof payForPrivateBooking.shape.body
>;
export type TVerifyPayment = z.infer<typeof verifyPayment.shape.body>;

export type TAssignDriverByCompanyPayloadType = z.infer<
   typeof assignDriverByCompanySchema.shape.body
>;

export type TStartBookingPayloadType = z.infer<
   typeof startBookingSchema.shape.body
>;
