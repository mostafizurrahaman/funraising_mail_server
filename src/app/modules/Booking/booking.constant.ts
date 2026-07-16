// ? 1. Booking Type
export const BookingType = {
   GKV: "gkv",
   PRIVATE: "private",
} as const;

export const BookingTypeValues = Object.values(BookingType);

export type TBookingType = (typeof BookingType)[keyof typeof BookingType];

// ? 2. Booking Prescription Attached:
const PrescriptionReasonType = {
   DIALYSIS: "DIALYSIS",
   ONCOLOGY: "ONCOLOGY",
   RADIOTHERAPY: "RADIOTHERAPY",
   LONG_TERM_TREATMENT: "LONG_TERM_TREATMENT",
   SINGLE_JOURNEY: "SINGLE_JOURNEY",
} as const;

export const PrescriptionReasonValues = Object.values(PrescriptionReasonType);

export type TPrescriptionReasonType =
   (typeof PrescriptionReasonType)[keyof typeof PrescriptionReasonType];

// ? 3. Booking Payment Status:
export const BookingPaymentStatus = {
   PENDING: "PENDING",
   REFERENCE_SUBMITTED: "REFERENCE_SUBMITTED",
   PAID: "PAID",
   FAILED: "FAILED",
   REFUNDED: "REFUNDED",
} as const;

export const BookingPaymentStatusValues = Object.values(BookingPaymentStatus);

export type TBookingPaymentStatusType =
   (typeof BookingPaymentStatus)[keyof typeof BookingPaymentStatus];

// ? 4. Vehicle Type:
export const VehicleType = {
   TAXI_OR_RENTAL_CAR: "TAXI_OR_RENTAL_CAR",
   CARRY_CHAIR: "CARRY_CHAIR",
   WHEEL_CHAIR: "WHEEL_CHAIR",
} as const;

export const VehicleTypeValues = Object.values(VehicleType);

export type TVehicleType = (typeof VehicleType)[keyof typeof VehicleType];

// ? 5. Payment Method:
export const PaymentMethod = {
   CASH: "CASH",
   CARD: "CARD",
   BANK_TRANSFER: "BANK_TRANSFER",
   ONLINE: "ONLINE",
} as const;

export const PaymentMethodValues = Object.values(PaymentMethod);

export type TPaymentMethodType =
   (typeof PaymentMethod)[keyof typeof PaymentMethod];

// ? 6. Booking Status:

export const BookingStatus = {
   NEW: "NEW",
   ASSIGNED: "ASSIGNED",
   COMPLETED: "COMPLETED",
   CANCELLED: "CANCELLED",
} as const;

export const BookingStatusValues = Object.values(BookingStatus);

export type TBookingStatusType =
   (typeof BookingStatus)[keyof typeof BookingStatus];
