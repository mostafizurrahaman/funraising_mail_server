export const Currency = {
   EUR: "eur",
} as const;

export const CurrencyValues = Object.values(Currency);
export const Country = {
   GERMANY: "Germany",
} as const;

export const CountryValues = Object.values(Country);

export type TCountry = (typeof Country)[keyof typeof Country];
export type TCurrency = (typeof Currency)[keyof typeof Currency];
