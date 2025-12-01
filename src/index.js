import "dotenv/config";
import express from "express";
import solarUnitRouter from "./api/solar-unit.js";
import { connectDB } from "./infrastructure/db.js";
import energyGenerationRecordRouter from "./api/energy-genaration-record.js";
 

const server = express();
server.use(express.json());


server.use("/api/solar-units", solarUnitRouter);
server.use("/api/energy-generation-records", energyGenerationRecordRouter);

connectDB();

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

