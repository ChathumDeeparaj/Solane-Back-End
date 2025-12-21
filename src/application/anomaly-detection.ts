
import { EnergyGenerationRecord } from "../infrastructure/entities/EnergyGenerationRecord";
import { SolarUnit } from "../infrastructure/entities/SolarUnit";
import { Anomaly } from "../infrastructure/entities/Anomaly";

/**
 * Runs the anomaly detection system for all solar units.
 */
export const runAnomalyDetectionSystem = async () => {
    console.log("Starting Anomaly Detection System...");
    const solarUnits = await SolarUnit.find();

    for (const solarUnit of solarUnits) {
        try {
            await detectAnomaliesForUnit(solarUnit);
        } catch (error) {
            console.error(
                `Error detecting anomalies for solar unit ${solarUnit.serialNumber}:`,
                error
            );
        }
    }
    console.log("Anomaly Detection System run complete.");
};

/**
 * Detects anomalies for a specific solar unit based on its energy generation history.
 */
export const detectAnomaliesForUnit = async (solarUnit: any) => {
    // Fetch records sorted by timestamp
    const records = await EnergyGenerationRecord.find({
        solarUnitId: solarUnit._id,
    }).sort({ timestamp: 1 });

    if (records.length === 0) return;

    const anomaliesToInsert: any[] = [];

    for (let i = 0; i < records.length; i++) {
        const record = records[i];
        const energy = record.energyGenerated;
        const date = new Date(record.timestamp);
        const hour = date.getUTCHours();
        const isNight = hour < 6 || hour > 18;
        const isPeak = hour >= 10 && hour <= 14;

        // --- RULE 1: Nighttime Generation (Sensor Malfunction) ---
        // Critical if > 0.5 kWh at night
        if (isNight && energy > 0.5) {
            anomaliesToInsert.push({
                solarUnitId: solarUnit._id,
                type: "NIGHTTIME_GENERATION",
                severity: "WARNING",
                description: `Detected ${energy} kWh generation during night hours (${hour}:00 UTC).`,
                recordTimestamp: record.timestamp,
            });
            continue; // Skip other checks if this fails
        }

        // --- RULE 2: Zero Generation During Peak Info (Critical Failure) ---
        // Critical if 0 kWh during peak sun (10am-2pm)
        if (isPeak && energy < 0.1) {
            anomaliesToInsert.push({
                solarUnitId: solarUnit._id,
                type: "ZERO_GENERATION_PEAK",
                severity: "CRITICAL",
                description: `Zero energy generation (${energy} kWh) detected during peak sun hours (${hour}:00 UTC).`,
                recordTimestamp: record.timestamp,
            });
            continue;
        }

        // --- RULE 3: Sudden Performance Drop ---
        // Warning if drops by > 50% compared to previous reading (if both are day)
        if (i > 0) {
            const prevRecord = records[i - 1];
            const prevHour = new Date(prevRecord.timestamp).getUTCHours();
            const isPrevDay = prevHour >= 6 && prevHour <= 18;
            const isDay = !isNight;

            if (isDay && isPrevDay && prevRecord.energyGenerated > 10) {
                const dropRatio =
                    (prevRecord.energyGenerated - energy) / prevRecord.energyGenerated;
                if (dropRatio > 0.5) {
                    anomaliesToInsert.push({
                        solarUnitId: solarUnit._id,
                        type: "SUDDEN_DROP",
                        severity: "WARNING",
                        description: `Output dropped by ${Math.round(
                            dropRatio * 100
                        )}% from previous reading (${prevRecord.energyGenerated} -> ${energy} kWh).`,
                        recordTimestamp: record.timestamp,
                    });
                }
            }
        }

        // --- RULE 4: Inverter Clipping (Capacity Limit) ---
        // Info if energy hits exactly 350 kWh (simulated cap) consistently
        if (energy === 350) {
            // Check if previous was also 350 to avoid noise
            if (i > 0 && records[i - 1].energyGenerated === 350) {
                anomaliesToInsert.push({
                    solarUnitId: solarUnit._id,
                    type: "INVERTER_CLIPPING",
                    severity: "INFO",
                    description: `Inverter reached maximum capacity limit (350 kWh) for consecutive periods.`,
                    recordTimestamp: record.timestamp,
                });
            }
        }
    }

    // Bulk Insert / Upsert to avoid duplicates
    // Using loop for simplicity as we have a unique index on (solarUnitId, type, recordTimestamp)
    // insertMany with ordered:false will insert valid ones and ignore duplicates
    if (anomaliesToInsert.length > 0) {
        try {
            await Anomaly.insertMany(anomaliesToInsert, { ordered: false });
            console.log(
                `Inserted ${anomaliesToInsert.length} anomalies for ${solarUnit.serialNumber}`
            );
        } catch (error: any) {
            // Ignore duplicate key errors (code 11000)
            if (error.code !== 11000 && error.writeErrors?.some((e: any) => e.code !== 11000)) {
                console.error("Error inserting anomalies:", error);
            }
        }
    }
};
