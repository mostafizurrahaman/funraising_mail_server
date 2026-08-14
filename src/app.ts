import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { configs } from "./app/configs";
import { notFound } from "./app/middlewares";
import globalErrorHandler from "./app/middlewares/global-error-handler";
import { allRoutes } from "./app/routes";
// import dns from "node:dns";

// dns.setServers(["1.1.1.1"]);

// Create an app :

const app: Application = express();

app.use(
   cors({
      origin: [
         "http://localhost:3000",
         "https://mediride-booking-fe.vercel.app",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
   }),
);
// Middlewares
app.use(express.json());
app.use(cookieParser());

// Entry route of the server:
app.get("/", (req, res) => {
   res.json({
      success: true,
      message: `Server is running on port ${configs?.port}`,
   });
});

// Health check api:
app.get("/health-check", (req, res) => {
   res.json({
      success: true,
      message: `Your server health is okay!`,
   });
});

app.use("/api/v1", allRoutes);

// Not found page:
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

export default app;
