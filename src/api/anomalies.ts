
import { Router } from "express";
import { Anomaly } from "../infrastructure/entities/Anomaly";
import { runAnomalyDetectionSystem } from "../application/anomaly-detection";
import { syncEnergyGenerationRecords } from "../application/background/sync-energy-generation-records";

const router = Router();

// GET /anomalies
// Supports filtering by solarUnitId, type, severity, resolutionStatus
router.get("/", async (req, res) => {
    try {
        const { solarUnitId, type, severity, resolutionStatus } = req.query;

        const query: any = {};
        if (solarUnitId) query.solarUnitId = solarUnitId;
        if (type) query.type = type;
        if (severity) query.severity = severity;
        if (resolutionStatus) query.resolutionStatus = resolutionStatus;

        const anomalies = await Anomaly.find(query)
            .sort({ recordTimestamp: -1 })
            .populate("solarUnitId", "serialNumber userId");

        res.json(anomalies);
    } catch (error) {
        console.error("Error fetching anomalies:", error);
        res.status(500).json({ error: "Failed to fetch anomalies" });
    }
});

// GET /anomalies/stats
router.get("/stats", async (req, res) => {
    try {
        res.status(501).json({ message: "Not implemented yet" });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

// PATCH /anomalies/:id
// Update status (ACKNOWLEDGE / RESOLVE)
router.patch("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { resolutionStatus } = req.body;

        if (!["OPEN", "RESOLVED", "ACKNOWLEDGED"].includes(resolutionStatus)) {
            return res.status(400).json({ error: "Invalid resolution status" });
        }

        const anomaly = await Anomaly.findByIdAndUpdate(
            id,
            { resolutionStatus },
            { new: true }
        );

        if (!anomaly) {
            return res.status(404).json({ error: "Anomaly not found" });
        }

        res.json(anomaly);
    } catch (error) {
        console.error("Error updating anomaly:", error);
        res.status(500).json({ error: "Failed to update anomaly" });
    }
});

// POST /anomalies/trigger-detection
// Manual trigger for testing/demo
router.post("/trigger-detection", async (req, res) => {
    try {
        console.log("Triggered: Syncing records...");
        await syncEnergyGenerationRecords();
        console.log("Triggered: Detecting anomalies...");
        await runAnomalyDetectionSystem();
        res.json({ message: "Anomaly detection system triggered successfully (Synced & Scanned)" });
    } catch (error) {
        console.error("Trigger error:", error);
        res.status(500).json({ error: "Failed to run detection" });
    }
});

export default router;
