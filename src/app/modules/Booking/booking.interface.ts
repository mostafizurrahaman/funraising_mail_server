import type { Document, Model, Types } from "mongoose";
import type {
   TBookingPaymentStatusType,
   TBookingStatusType,
   TBookingType,
   TPaymentMethodType,
   TPrescriptionReasonType,
   TVehicleType,
} from "./booking.constant";
import type { IGeoJSONPoint } from "../Company/company.interface";

export interface IBooking {
   bookingNumber: string; // unique
   company: Types.ObjectId;
   patientName: string;
   phone: string;
   bookingType: TBookingType;

   // Pickup  Address:
   pickupAddress: string;
   pickupPostalCode?: string;
   pickupLocation: IGeoJSONPoint;

   // Destination Address:
   destinationAddress: string;
   destinationPostalCode?: string;
   destinationLocation: IGeoJSONPoint;

   // Ride Date & Time:
   rideDate: Date;
   desiredArrivalTime: string; // Will rename to Desired Arrival Time in frontend, but backend can keep as desiredArrivalTime or we use arrivalTime
   tripIntent: 'ONE_WAY' | 'ROUND_TRIP';
   calculatedPickupTime?: string;
   rideAt: Date;

   // Estimated Distance:
   estimatedDistance: number; // in km
   estimatedRidingTime: number; // in min

   // Platform fee from each booking:
   platformFee: number; // snapshot

   // invoice Url:
   invoiceUrl?: string;

   // assign driver ;
   assignedDriver?: Types.ObjectId;

   notes: string;

   // Booking Status:
   bookingStatus: TBookingStatusType;
   cancelReason?: string;
   completedAt: Date;
}

export interface IGkvBooking {
   insuranceName: string;
   insuranceNumber: string;
   vehicleType: TVehicleType;
   prescriptionReason: TPrescriptionReasonType;
   prescriptionAttached: boolean;
   prescriptionFiles: string[];
}

export interface IPrivateBooking {
   estimatedFixedPrice: number;
   bookingCharges: Types.ObjectId[];
   bookingChargeSnapshot: unknown; // snapshot
   basePrice: number; // to keep snapshot of the price
   pricePerKm: number; //  snapshot of the pricePerKm :

   // Payment related fields:
   paymentStatus: TBookingPaymentStatusType;
   paymentMethod?: TPaymentMethodType;
   paymentReference?: string;
}

export interface IBookingDoc extends IBooking, Document {}
export interface IGkvBookingDoc extends IBooking, IGkvBooking, Document {}
export interface IPrivateBookingDoc
   extends IBooking, IPrivateBooking, Document {}
