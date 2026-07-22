import { AppError } from "@/app/errors";
import httpStatus from "http-status";
import type { IAuthDoc } from "../Auth/auth.interface";
import { Bank } from "./bank.model";
import type { TCreateBankPayload, TUpdateBankPayload } from "./bank.validation";

const createIntoDB = async (user: IAuthDoc, payload: TCreateBankPayload) => {
   // Verify if bank details already exist for this user
   const existingBank = await Bank.findOne({ user: user._id });
   if (existingBank) {
      throw new AppError(
         httpStatus.CONFLICT,
         "Bank details already exist for this user. Please update instead.",
      );
   }

   const result = await Bank.create({
      user: user._id,
      ...payload,
   });

   return result;
};

const updateInDB = async (user: IAuthDoc, payload: TUpdateBankPayload) => {
   const existingBank = await Bank.findOne({ user: user._id });
   if (!existingBank) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Bank details not found for this user.",
      );
   }

   const result = await Bank.findOneAndUpdate(
      { user: user._id },
      { $set: payload },
      { new: true, runValidators: true },
   );

   return result;
};

const getFromDB = async (user: IAuthDoc) => {
   const result = await Bank.findOne({ user: user._id });
   if (!result) {
      throw new AppError(
         httpStatus.NOT_FOUND,
         "Bank details not found for this user.",
      );
   }
   return result;
};

export const BankServices = {
   createIntoDB,
   updateInDB,
   getFromDB,
};
