export const PaymentGateway = {
   CASH: "cash",
   MANUAL_BANK_TRANSFER: "manual",
   PAYPAL: "paypal",
} as const;

export const TransactionStatus = {
   SUCCESS: "success",
   FAILED: "failed",
   PENDING: "pending",
} as const;

export const PaymentGatewayValues = Object.values(PaymentGateway);
export const TransactionStatusValues = Object.values(TransactionStatus);

export type TPaymentGateway =
   (typeof PaymentGateway)[keyof typeof PaymentGateway];

export type TTransactionStatusType =
   (typeof TransactionStatus)[keyof typeof TransactionStatus];
