import express from "express";
import { 
  getAllSolarUnits, 
  createSolarUnit, 
  getSolarUnitById, 
  updateSolarUnit,
  deleteSolarUnit
} from "../application/solar-unit";

const solarUnitRouter = express.Router();

solarUnitRouter.route("/").get(getAllSolarUnits).post(createSolarUnit);
solarUnitRouter.route("/:id")
.get(getSolarUnitById)
.put(updateSolarUnit)
.delete(deleteSolarUnit);
// solarUnitRouter.route("/:id").get().put().delete();

export default solarUnitRouter;