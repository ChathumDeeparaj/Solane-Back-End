import express from "express";
import { 
  getAllSolarUnits, 
  createSolarUnit, 
  getSolarUnitById, 
  updateSolarunit,
  deleteSolarUnit
} from "../application/solar-unit.js";

const solarUnitRouter = express.Router();

solarUnitRouter.route("/").get(getAllSolarUnits).post(createSolarUnit);
solarUnitRouter.route("/:id").get(getSolarUnitById).put(updateSolarunit).delete(deleteSolarUnit);
// solarUnitRouter.route("/:id").get().put().delete();

export default solarUnitRouter;