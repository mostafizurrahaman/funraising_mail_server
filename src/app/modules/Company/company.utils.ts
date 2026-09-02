import { Company } from "./company.model";

/**
 * Generates a URL-safe, normalized slug from company name + postal code.
 *
 * Steps:
 *  1. Normalize Unicode characters to their ASCII base (e.g. "ä" → "a")
 *  2. Lowercase the entire string
 *  3. Replace any run of non-alphanumeric characters with a single hyphen
 *  4. Trim leading/trailing hyphens
 *  5. Append "--{postalCode}" so two companies with the same name in
 *     different locations are not treated as duplicates
 *
 * Example: ("MedRide Transports GmbH", "10115") → "medride-transports-gmbh--10115"
 */
export const generateCompanySlug = (companyName: string, postalCode: string): string => {
   const normalizedName = companyName
      .normalize("NFD")                // decompose accented chars (ä → a + combining diacritic)
      .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")    // collapse any non-alphanumeric run → single hyphen
      .replace(/^-+|-+$/g, "");        // trim edge hyphens

   const normalizedPostal = postalCode.trim().toLowerCase().replace(/\s+/g, "");

   return `${normalizedName}--${normalizedPostal}`;
};

export const generateCompanyCode = (): string => {
   const randomNumber = Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(9, "0");

   return `COM${randomNumber}`;
};

export const generateUniqueCompanyCode = async (): Promise<string> => {
   while (true) {
      const companyCode = generateCompanyCode();

      const exists = await Company.exists({ companyCode });

      if (!exists) {
         return companyCode;
      }
   }
};
