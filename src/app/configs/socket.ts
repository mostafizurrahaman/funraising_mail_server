// path: src/app/utils/socket.ts

import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "node:http";
import mongoose from "mongoose";
import { configs } from "../configs";
import { Auth } from "../modules/Auth/auth.model";
import { AuthRole, AuthStatus } from "../modules/Auth/auth.constant";
import { Booking } from "../modules/Booking/booking.model";
import { BookingStatus } from "../modules/Booking/booking.constant";
import { TrackingState } from "../modules/TrackingState/tracking-state.model";
import { verifyToken } from "../utils";
import { BookingServices } from "../modules/Booking/booking.services";

let io: SocketIOServer;

// ================= MATHEMATICAL HELPERS =================

/**
 * Calculates the Haversine distance in Kilometers between two GPS coordinates
 */
const getDistanceInKm = (
   lat1: number,
   lon1: number,
   lat2: number,
   lon2: number,
): number => {
   if (lat1 === lat2 && lon1 === lon2) return 0;
   const R = 6371; // Earth's radius in KM
   const dLat = ((lat2 - lat1) * Math.PI) / 180;
   const dLon = ((lon2 - lon1) * Math.PI) / 180;
   const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
         Math.cos((lat2 * Math.PI) / 180) *
         Math.sin(dLon / 2) *
         Math.sin(dLon / 2);
   const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   return R * c;
};

/**
 * Calculates current progress based on distance covered and distance remaining
 */
const calculateProgress = (
   driverLat: number,
   driverLng: number,
   pickupLat: number,
   pickupLng: number,
   destLat: number,
   destLng: number,
): number => {
   const totalDistance = getDistanceInKm(
      pickupLat,
      pickupLng,
      destLat,
      destLng,
   );
   const distanceRemaining = getDistanceInKm(
      driverLat,
      driverLng,
      destLat,
      destLng,
   );

   if (totalDistance <= 0.05) return 1.0; // If total distance is under 50m, start at 100%

   const progress = 1.0 - distanceRemaining / totalDistance;

   // Clamp progress between 0.00 and 1.00 (two decimal places)
   return Math.round(Math.min(1.0, Math.max(0.0, progress)) * 100) / 100;
};

// ================= SOCKET INITIALIZER =================

export const initSocket = (httpServer: HTTPServer) => {
   io = new SocketIOServer(httpServer, {
      cors: {
         origin: "*", // Adjust to specific client domains in production
         credentials: true,
      },
   });

   // 1. Socket Authentication Middleware using JWT
   io.use(async (socket: Socket, next) => {
      try {
         const token =
            socket.handshake.auth?.token || socket.handshake.query?.token;

         if (!token) {
            return next(
               new Error(
                  "Authentication token is missing. Connection rejected.",
               ),
            );
         }

         // Decode and verify the token safely using the JWT helper
         const decoded = verifyToken(
            token as string,
            configs.accessTokenSecret,
         );

         const user = await Auth.findById(decoded._id);

         if (!user) {
            return next(new Error("User account not found."));
         }

         if (user.status !== AuthStatus.ACTIVE) {
            return next(
               new Error(`Account unauthorized. Status: ${user.status}`),
            );
         }

         // Attach the authenticated user details securely to the socket instance
         (socket as any).user = user;
         next();
      } catch (err: any) {
         next(new Error(err.message || "Socket authentication failed."));
      }
   });

   // 2. Setup WebSocket Event Listeners
   io.on("connection", (socket: Socket) => {
      const user = (socket as any).user;
      console.log(
         `🔌 Connected: ${user.name} (${user.role}) | Socket ID: ${socket.id}`,
      );

      // A. Join a Booking Room (Accessible by Passenger, Driver, and Company Admin)
      socket.on("join-booking-room", (data: { bookingId: string }) => {
         const { bookingId } = data;
         if (!bookingId || !mongoose.isValidObjectId(bookingId)) {
            return socket.emit("error", {
               message: "Invalid booking ID format.",
            });
         }

         const roomName = `booking_room_${bookingId}`;
         socket.join(roomName);
         console.log(`👤 Socket ${socket.id} joined room: ${roomName}`);
      });

      // B. Leave a Booking Room (Clean up connections when client exits tracking map)
      socket.on("leave-booking-room", (data: { bookingId: string }) => {
         const { bookingId } = data;
         if (bookingId) {
            const roomName = `booking_room_${bookingId}`;
            socket.leave(roomName);
            console.log(`👤 Socket ${socket.id} left room: ${roomName}`);
         }
      });

      // C. Driver Starts the Ride (Changes status from ASSIGNED to STARTED with Proximity Validation)
      socket.on(
         "start-ride",
         async (data: {
            bookingId: string;
            latitude: number;
            longitude: number;
         }) => {
            const { bookingId, latitude, longitude } = data;
            const roomName = `booking_room_${bookingId}`;

            if (user.role !== AuthRole.DRIVER) {
               return socket.emit("error", {
                  message:
                     "Access denied. Only assigned drivers can start this ride.",
               });
            }

            try {
               // Execute proximity checks & DB transaction through our service layer
               const result = await BookingServices.startBookingByDriver(
                  user,
                  bookingId,
                  { longitude, latitude },
               );

               // Broadcast state transition to everyone connected to this booking room
               io.to(roomName).emit("ride-status-changed", {
                  bookingId,
                  status: BookingStatus.STARTED,
                  tracking: result.tracking,
               });

               console.log(
                  `🚀 Ride ${bookingId} has successfully STARTED with Proximity validation.`,
               );
            } catch (error: any) {
               console.error("Socket error on start-ride:", error);
               socket.emit("error", {
                  message:
                     error.message ||
                     "Failed to start the ride due to validation errors.",
               });
            }
         },
      );

      // D. Update Driver Location (GPS streaming, backend progress calculation & DB storage)
      socket.on(
         "update-driver-location",
         async (data: {
            bookingId: string;
            latitude: number;
            longitude: number;
            address: string;
            running: boolean;
         }) => {
            const { bookingId, latitude, longitude, address, running } = data;
            const roomName = `booking_room_${bookingId}`;

            if (user.role !== AuthRole.DRIVER) {
               return socket.emit("error", {
                  message:
                     "Access denied. Only assigned drivers can transmit GPS tracking logs.",
               });
            }

            try {
               const booking = await Booking.findById(bookingId);
               if (!booking) {
                  return socket.emit("error", {
                     message: "Booking not found.",
                  });
               }

               // Verify that the emitting driver is assigned to this booking
               if (booking.assignedDriver?.toString() !== user._id.toString()) {
                  return socket.emit("error", {
                     message:
                        "Access denied. You are not authorized to track this ride.",
                  });
               }

               // Block location logs if the ride status is not 'STARTED'
               if (booking.bookingStatus !== BookingStatus.STARTED) {
                  return socket.emit("error", {
                     message:
                        "Live tracking is suspended. Please start the ride first.",
                  });
               }

               // Safe type conversions of the original Mongoose [String] coordinates
               const pickupLng = Number(booking.pickupLocation.coordinates[0]);
               const pickupLat = Number(booking.pickupLocation.coordinates[1]);
               const destLng = Number(
                  booking.destinationLocation.coordinates[0],
               );
               const destLat = Number(
                  booking.destinationLocation.coordinates[1],
               );

               // Calculate dynamic progress on the backend
               const calculatedProgress = calculateProgress(
                  latitude,
                  longitude,
                  pickupLat,
                  pickupLng,
                  destLat,
                  destLng,
               );

               // Determine arrival based on a 100-meter proximity threshold to the destination
               const distanceToDestinationInMeters =
                  getDistanceInKm(latitude, longitude, destLat, destLng) * 1000;
               const isArrived = distanceToDestinationInMeters <= 100;

               const finalProgress = isArrived ? 1.0 : calculatedProgress;
               const finalRunning = isArrived ? false : running;

               // Convert coordinates safely to strings to align with [String] mapping definition
               const coordinatesStringArray = [
                  longitude.toString(),
                  latitude.toString(),
               ];

               // Save tracking coordinate logs inside database transaction session
               const session = await mongoose.startSession();
               try {
                  session.startTransaction();

                  const updatedTracking = await TrackingState.findOneAndUpdate(
                     { booking: bookingId },
                     {
                        $set: {
                           address,
                           addressLocation: {
                              type: "Point",
                              coordinates: coordinatesStringArray,
                           },
                           progress: finalProgress,
                           running: finalRunning,
                        },
                     },
                     { new: true, upsert: true, session },
                  );

                  // Auto-complete the ride when driver is within 100m of destination
                  if (isArrived) {
                     booking.bookingStatus = BookingStatus.COMPLETED;
                     await booking.save({ session });

                     // Notify room that the ride is completed
                     io.to(roomName).emit("ride-status-changed", {
                        bookingId,
                        status: BookingStatus.COMPLETED,
                     });
                  }

                  await session.commitTransaction();

                  // E. Broadcast coordinates live to passengers & operators connected to the room
                  io.to(roomName).emit("location-updated", {
                     bookingId,
                     latitude,
                     longitude,
                     progress: finalProgress,
                     address,
                     running: finalRunning,
                     bookingStatus: isArrived
                        ? BookingStatus.COMPLETED
                        : BookingStatus.STARTED,
                  });
               } catch (err) {
                  await session.abortTransaction();
                  throw err;
               } finally {
                  await session.endSession();
               }
            } catch (error) {
               console.error("Socket error on location-update:", error);
               socket.emit("error", {
                  message:
                     "Database update error during location transmission.",
               });
            }
         },
      );

      socket.on("disconnect", () => {
         console.log(`❌ Disconnected: Socket ID ${socket.id}`);
      });
   });

   return io;
};

export const getIO = () => {
   if (!io) {
      throw new Error("Socket.io is not initialized yet.");
   }
   return io;
};
