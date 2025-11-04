import express from "express";
import solarUnitRouter from "./api/solar-unit.js";


const server = express();

server.use("/api/solar-units", solarUnitRouter);

server.get("/api", (req, res) => {
    res.status(200).json({ message: "Hello World" });
});

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
