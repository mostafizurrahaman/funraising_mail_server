import { model, Schema, Types } from "mongoose";
import type {
   IBookingDoc,
   IGkvBookingDoc,
   IPrivateBooking,
   IPrivateBookingDoc,
} from "./booking.interface";
import {
   BookingPaymentStatus,
   BookingPaymentStatusValues,
   BookingStatus,
   BookingStatusValues,
   BookingType,
   BookingTypeValues,
   PaymentMethod,
   PaymentMethodValues,
   PrescriptionReasonValues,
   VehicleTypeValues,
} from "./booking.constant";
import {
   geoLocationType,
   geoLocationTypeValues,
} from "../Company/company.constants";

const bookingSchema = new Schema<IBookingDoc>(
   {
      bookingNumber: {
         type: String,
         required: true,
         unique: true,
      },
      company: {
         type: Types.ObjectId,
         ref: "Auth",
         required: true,
      },
      patientName: {
         type: String,
         required: true,
      },
      phone: {
         type: String,
         required: true,
      },
      bookingType: {
         type: String,
         enum: BookingTypeValues,
         required: true,
      },

      //  Pickup and destination address:
      pickupAddress: {
         type: String,
         required: true,
      },
      pickupLocation: {
         type: {
            type: String,
            enum: geoLocationTypeValues,
            default: geoLocationType.Point,
            required: true,
         },
         coordinates: {
            type: [Number],
         },
      },

      destinationAddress: {
         type: String,
         required: true,
      },
      destinationLocation: {
         type: {
            type: String,
            enum: geoLocationTypeValues,
            default: geoLocationType.Point,
            required: true,
         },
         coordinates: {
            type: [Number],
         },
      },

      rideDate: {
         type: Date,
         required: true,
      },
      rideTime: {
         type: String,
         required: true,
      },
      rideAt: {
         type: Date,
         required: true,
      },
      estimatedDistance: {
         type: Number,
         required: true,
         min: 0,
      },
      estimatedRidingTime: {
         type: Number,
         required: true,
         min: 0,
      },
      // ? Snapshot
      platformFee: {
         type: Number,
         min: 0,
      },

      invoiceUrl: {
         type: String,
      },
      assignedDriver: {
         type: Types.ObjectId,
         ref: "Driver",
         default: null,
      },
      notes: {
         type: String,
      },
      bookingStatus: {
         type: String,
         enum: BookingStatusValues,
         required: true,
         default: BookingStatus.NEW,
      },
      completedAt: {
         type: Date,
      },
   },
   {
      discriminatorKey: "bookingType",
      timestamps: true,
      versionKey: false,
   },
);

const gkvBookingSchema = new Schema<IGkvBookingDoc>({
   insuranceName: {
      type: String,
      required: true,
   },
   insuranceNumber: {
      type: String,
      required: true,
   },
   vehicleType: {
      type: String,
      enum: VehicleTypeValues,
      required: true,
   },
   prescriptionReason: {
      type: String,
      enum: PrescriptionReasonValues,
      required: true,
   },
   prescriptionAttached: {
      type: Boolean,
      required: true,
   },
   prescriptionFiles: {
      type: [String],
   },
});

const privateBookingSchema = new Schema<IPrivateBookingDoc>({
   estimatedFixedPrice: {
      type: Number,
      required: true,
      min: 0,
   },
   basePrice: {
      type: Number,
      required: true,
      min: 0,
   },
   pricePerKm: {
      type: Number,
      required: true,
      min: 0,
   },
   bookingCharges: {
      type: [Types.ObjectId],
      ref: "Surcharge",
      required: true,
   },
   bookingChargeSnapshot: {
      type: Schema.Types.Mixed,
      default: null,
   },
   paymentStatus: {
      type: String,
      enum: BookingPaymentStatusValues,
      default: BookingPaymentStatus.PENDING,
      required: true,
   },
   paymentMethod: {
      type: String,
      enum: PaymentMethodValues,
   },
   paymentReference: {
      type: String,
   },
});

export const Booking = model<IBookingDoc>("Booking", bookingSchema);

// ? Create the model for the GKV Booking:
export const GkvBooking = Booking.discriminator<IGkvBookingDoc>(
   BookingType.GKV,
   gkvBookingSchema,
);

// ? Create the model for the GKV Booking:
export const PrivateBooking = Booking.discriminator<IPrivateBookingDoc>(
   BookingType.PRIVATE,
   privateBookingSchema,
);
