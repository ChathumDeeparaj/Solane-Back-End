import "dotenv/config";
import express from "express";
import energyGenerationRecordRouter from "./api/energy-generation-record";
import { globalErrorHandler } from "./api/middlewares/global-error-handling-middleware";
import { loggerMiddleware } from "./api/middlewares/logger-middleware";
import solarUnitRouter from "./api/solar-unit";
import { connectDB } from "./infrastructure/db";
import cors from "cors";
import webhooksRouter from "./api/webhooks";
import { clerkMiddleware } from "@clerk/express";
import usersRouter from "./api/users";
import weatherRouter from "./api/weather";
import capacityFactorRouter from "./api/capacity-factor";
import { handleStripeWebhook } from "./application/payment";
import invoiceRouter, { adminInvoiceRouter } from "./api/invoice";
import paymentRouter from "./api/payment";
import anomaliesRouter from "./api/anomalies";
import cron from "node-cron";
import { runAnomalyDetectionSystem } from "./application/anomaly-detection";
import { initializeScheduler } from "./infrastructure/scheduler";

// Initialize DB and Scheduler
connectDB();
initializeScheduler();

const server = express();
server.use(cors({ origin: "https://fed-4-front-end-chathum.netlify.app/" }));

server.use(loggerMiddleware);

server.use("/api/webhooks", webhooksRouter);

// MUST be before express.json()
server.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

server.use(clerkMiddleware())

server.use(express.json());

server.use("/api/solar-units", solarUnitRouter);
server.use("/api/energy-generation-records", energyGenerationRecordRouter);
server.use("/api/users", usersRouter);
server.use("/api/weather", weatherRouter);
server.use("/api/capacity-factor", capacityFactorRouter);
server.use("/api/invoices", invoiceRouter);
server.use("/api/admin", adminInvoiceRouter);
server.use("/api/payments", paymentRouter);
server.use("/api/anomalies", anomaliesRouter);

// Schedule Anomaly Detection: Run every hour
cron.schedule("0 * * * *", () => {
  console.log("Running scheduled anomaly detection...");
  runAnomalyDetectionSystem();
});

server.use(globalErrorHandler);

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log("Server is listening on PORT: ", PORT);
});
