// path: src/app/configs/socket.ts

import { Server as SocketIOServer, Socket } from "socket.io";
import type { Server as HTTPServer } from "node:http";
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

// ================= IN-MEMORY BOOKING CACHE =================

/**
 * Lightweight per-socket booking cache.
 * Avoids a DB round-trip on every GPS ping.
 * Cache is invalidated when the booking status changes (update-status event).
 */
interface CachedBooking {
   assignedDriver: string;
   bookingStatus: string;
   pickupLat: number;
   pickupLng: number;
   destLat: number;
   destLng: number;
   tripIntent?: string;
}

const bookingCache = new Map<string, CachedBooking>(); // key: bookingId

async function getOrFetchBookingCache(bookingId: string): Promise<CachedBooking | null> {
   if (bookingCache.has(bookingId)) {
      return bookingCache.get(bookingId)!;
   }

   const booking = await Booking.findById(bookingId).lean();
   if (!booking) return null;

   const cached: CachedBooking = {
      assignedDriver: booking.assignedDriver?.toString() ?? "",
      bookingStatus: booking.bookingStatus,
      pickupLat: Number(booking.pickupLocation.coordinates[1]),
      pickupLng: Number(booking.pickupLocation.coordinates[0]),
      destLat: Number(booking.destinationLocation.coordinates[1]),
      destLng: Number(booking.destinationLocation.coordinates[0]),
      tripIntent: (booking as any).tripIntent,
   };

   bookingCache.set(bookingId, cached);
   return cached;
}

function invalidateBookingCache(bookingId: string): void {
   bookingCache.delete(bookingId);
}

// ================= SOCKET INITIALIZER =================

export const initSocket = (httpServer: HTTPServer) => {
   io = new SocketIOServer(httpServer, {
      cors: {
         origin: [
            "http://localhost:3000",
            "https://mediride-booking-fe.vercel.app",
         ],
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

      // Join a personal room for direct events (e.g. driver assignments)
      socket.join(`user_room_${user._id}`);
      // Join a company room if applicable
      if (user.role === AuthRole.COMPANY) {
         socket.join(`company_room_${user._id}`);
      }

      // A. Join a Booking Room (Accessible by Passenger, Driver, and Company Admin)
      socket.on("join-booking-room", (data: { bookingId: string }) => {
         const { bookingId } = data;
         if (!bookingId) {
            return socket.emit("app-error", {
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

      // C. Driver Updates Ride Status (Sequential tracking logic)
      socket.on(
         "update-status",
         async (data: {
            bookingId: string;
            status: string;
            latitude?: number;
            longitude?: number;
         }) => {
            const { bookingId, status, latitude, longitude } = data;
            const roomName = `booking_room_${bookingId}`;

            if (user.role !== AuthRole.DRIVER) {
               return socket.emit("app-error", {
                  message:
                     "Access denied. Only assigned drivers can start this ride.",
               });
            }

            try {
               // The backend service verifies transitions and distance
               const result = await BookingServices.updateBookingStatusByDriver(
                  user,
                  bookingId,
                  status,
                  { longitude: longitude || 0, latitude: latitude || 0 },
               );

               // Invalidate cached booking so next GPS ping re-fetches the new status
               invalidateBookingCache(bookingId);

               // Broadcast state transition to everyone connected to this booking room
               io.to(roomName).emit("ride-status-changed", {
                  bookingId,
                  status: result.booking.bookingStatus,
                  tracking: result.tracking,
               });

               console.log(
                  `🚀 Ride ${bookingId} transitioned to ${result.booking.bookingStatus} successfully.`,
               );
            } catch (error: any) {
               console.error("Socket error on update-status:", error);
               socket.emit("app-error", {
                  message:
                     error.message ||
                     "Failed to update status due to validation errors.",
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
               return socket.emit("app-error", {
                  message:
                     "Access denied. Only assigned drivers can transmit GPS tracking logs.",
               });
            }

            try {
               // Use cached booking data to avoid a DB round-trip on every GPS ping
               const cached = await getOrFetchBookingCache(bookingId);

               if (!cached) {
                  return socket.emit("app-error", {
                     message: "Booking not found.",
                  });
               }

               // Verify that the emitting driver is assigned to this booking
               if (cached.assignedDriver !== user._id.toString()) {
                  return socket.emit("app-error", {
                     message:
                        "Access denied. You are not authorized to track this ride.",
                  });
               }

               // Block location logs if the ride is not in an active tracking state
               const activeStates: string[] = [
                  BookingStatus.APPROACHING_PICKUP,
                  BookingStatus.AT_PICKUP,
                  BookingStatus.IN_TRANSIT,
                  BookingStatus.RETURN_TRIP,
               ];
               if (!activeStates.includes(cached.bookingStatus)) {
                  return socket.emit("app-error", {
                     message:
                        "Live tracking is suspended. Please start the ride first.",
                  });
               }

               const { pickupLat, pickupLng, destLat, destLng } = cached;

               let targetLat: number, targetLng: number;
               let originLat: number, originLng: number;

               if (
                  cached.bookingStatus === BookingStatus.APPROACHING_PICKUP ||
                  cached.bookingStatus === BookingStatus.AT_PICKUP
               ) {
                  targetLat = pickupLat;
                  targetLng = pickupLng;
                  originLat = pickupLat;
                  originLng = pickupLng;
               } else if (
                  cached.bookingStatus === BookingStatus.IN_TRANSIT ||
                  cached.bookingStatus === BookingStatus.AT_DESTINATION
               ) {
                  targetLat = destLat;
                  targetLng = destLng;
                  originLat = pickupLat;
                  originLng = pickupLng;
               } else {
                  // RETURN_TRIP
                  targetLat = pickupLat;
                  targetLng = pickupLng;
                  originLat = destLat;
                  originLng = destLng;
               }

               // Calculate dynamic progress on the backend
               const calculatedProgress = calculateProgress(
                  latitude,
                  longitude,
                  originLat,
                  originLng,
                  targetLat,
                  targetLng,
               );

               // Determine arrival based on a 100-meter proximity threshold
               const distanceToTargetInMeters =
                  getDistanceInKm(latitude, longitude, targetLat, targetLng) * 1000;
               const isArrived = distanceToTargetInMeters <= 100;
               const finalProgress = isArrived ? 1.0 : calculatedProgress;

               // Persist the latest driver location — no transaction needed for a single document upsert
               await TrackingState.findOneAndUpdate(
                  { booking: bookingId },
                  {
                     $set: {
                        address,
                        addressLocation: {
                           type: "Point",
                           coordinates: [longitude.toString(), latitude.toString()],
                        },
                        progress: finalProgress,
                        running,
                     },
                  },
                  { new: true, upsert: true },
               );

               // Broadcast live coordinates to passengers & operators in the room
               io.to(roomName).emit("location-updated", {
                  bookingId,
                  latitude,
                  longitude,
                  progress: finalProgress,
                  address,
                  running,
                  bookingStatus: cached.bookingStatus,
               });
            } catch (error) {
               console.error("Socket error on location-update:", error);
               socket.emit("app-error", {
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
