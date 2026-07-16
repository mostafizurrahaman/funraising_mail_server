export const InvoiceStatus = {
   OFFEN: "offen",
   BEZAHLT: "bezahlt",
   UEBERFAELLIG: "ueberfaellig",
} as const;

export const InvoiceStatusValues = Object.values(InvoiceStatus);

export type TInvoiceStatusType =
   (typeof InvoiceStatus)[keyof typeof InvoiceStatus];
