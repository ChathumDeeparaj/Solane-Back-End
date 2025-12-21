
import mongoose from "mongoose";

const anomalySchema = new mongoose.Schema(
    {
        solarUnitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SolarUnit",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "NIGHTTIME_GENERATION",
                "ZERO_GENERATION_PEAK",
                "SUDDEN_DROP",
                "INVERTER_CLIPPING",
            ],
            required: true,
        },
        severity: {
            type: String,
            enum: ["CRITICAL", "WARNING", "INFO"],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        resolutionStatus: {
            type: String,
            enum: ["OPEN", "RESOLVED", "ACKNOWLEDGED"],
            default: "OPEN",
        },
        recordTimestamp: {
            type: Date,
            required: true,
        },
        detectedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate anomalies for the same unit & type & timestamp
anomalySchema.index(
    { solarUnitId: 1, type: 1, recordTimestamp: 1 },
    { unique: true }
);

export const Anomaly = mongoose.model("Anomaly", anomalySchema);
