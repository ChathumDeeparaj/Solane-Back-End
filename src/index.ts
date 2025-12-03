import "dotenv/config";
import express from "express";
import solarUnitRouter from "./api/solar-unit";
import { connectDB } from "./infrastructure/db";
import energyGenerationRecordRouter from "./api/energy-genaration-record";
import { loggerMiddleware } from "./api/middlewares/logger-middleware";

const server = express();
server.use(express.json());

server.use(loggerMiddleware);

server.use("/api/solar-units", solarUnitRouter);
server.use("/api/energy-generation-records", energyGenerationRecordRouter);

connectDB();

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

