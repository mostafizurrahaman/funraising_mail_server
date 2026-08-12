import { TrackingState } from "./tracking-state.model";
import httpStatus from "http-status";
import { AppError } from "../../errors";

const getByBookingId = async (bookingId: string) => {
   const state = await TrackingState.findOne({ booking: bookingId });
   if (!state) {
      throw new AppError(httpStatus.NOT_FOUND, "Tracking state not found!");
   }
   return state;
};

const startTracking = async (bookingId: string) => {
   const state = await TrackingState.findOneAndUpdate(
      { booking: bookingId },
      { running: true },
      { new: true, upsert: true }
   );
   return state;
};

const pauseTracking = async (bookingId: string) => {
   const state = await TrackingState.findOneAndUpdate(
      { booking: bookingId },
      { running: false },
      { new: true }
   );
   if (!state) {
       throw new AppError(httpStatus.NOT_FOUND, "Tracking state not found!");
   }
   return state;
};

const updateProgress = async (bookingId: string, progress: number) => {
   const state = await TrackingState.findOneAndUpdate(
      { booking: bookingId },
      { progress },
      { new: true }
   );
   if (!state) {
       throw new AppError(httpStatus.NOT_FOUND, "Tracking state not found!");
   }
   return state;
};

const deleteTracking = async (bookingId: string) => {
   const state = await TrackingState.findOneAndDelete({ booking: bookingId });
   if (!state) {
       throw new AppError(httpStatus.NOT_FOUND, "Tracking state not found!");
   }
   return state;
};

export const TrackingStateServices = {
   getByBookingId,
   startTracking,
   pauseTracking,
   updateProgress,
   deleteTracking
};
