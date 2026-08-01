import { Company } from "./company.model";

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
