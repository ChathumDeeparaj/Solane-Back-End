import mongoose from "mongoose";
 

const energyGenarerationRecordSchema = new mongoose.Schema({
    solarUnitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SolarUnit",
        required: true,
    },

    energyGenarated:{
        type: Number,
        required: true,
        unique: true,
    },

    timestamp: {
        type: Date,
        default: Date.now,
    },

    intervalHours: {
        type: Number,
        default: 2,
        min: 0.1,
        max: 24,
    },

});
export const EnergyGenerationRecord = mongoose.model("EnergyGenarationRecord", energyGenarerationRecordSchema);