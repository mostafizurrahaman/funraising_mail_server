import express, { type Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { configs } from "@/app/configs";
import { notFound } from "./app/middlewares";
import globalErrorHandler from "./app/middlewares/global-error-handler";

// Create an app :

const app: Application = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
   cors({
      origin: "*",
      credentials: true,
   }),
);

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

// Not found page:
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

export default app;
