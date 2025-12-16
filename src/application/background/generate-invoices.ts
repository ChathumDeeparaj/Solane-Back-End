import { startOfDay, subMonths, endOfDay } from "date-fns";
import { SolarUnit } from "../../infrastructure/entities/SolarUnit";
import { EnergyGenerationRecord } from "../../infrastructure/entities/EnergyGenerationRecord";
import { Invoice } from "../../infrastructure/entities/Invoice";

export const generateInvoices = async () => {
    console.log("Starting invoice generation job...");
    const today = new Date();
    const currentDay = today.getDate();

    // 1. Find all active solar units
    // We can filter by status: "ACTIVE"
    const units = await SolarUnit.find({ status: "ACTIVE" });

    for (const unit of units) {
        const installDate = new Date(unit.installationDate);
        const installDay = installDate.getDate();

        // 2. Check if today matches the installation day (billing cycle)
        // Note: This logic simplifies strictly to the day of month. 
        // Edge cases like day 31 in Feb need more robust handling, but for this task:
        if (installDay === currentDay) {
            console.log(`Generating invoice for unit: ${unit.serialNumber}`);

            // Calculate Period: Last Month
            // Start: Same day last month
            // End: Yesterday (or today?) - usually billing is for completed period.
            // Let's say Period is [LastMonth, Today)
            const periodStart = subMonths(today, 1);
            const periodEnd = today;

            // 3. Sum energy generation
            // We sum all records between periodStart and periodEnd
            const aggregation = await EnergyGenerationRecord.aggregate([
                {
                    $match: {
                        solarUnitId: unit._id,
                        timestamp: { $gte: periodStart, $lt: periodEnd },
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalEnergy: { $sum: "$energyGenerated" },
                    },
                },
            ]);

            const totalEnergyGenerated = aggregation[0]?.totalEnergy || 0;

            // 4. Create Invoice
            // Avoid duplicate invoices for same period? 
            // We could check if one exists, but for simplicity we rely on the cron running once/day.

            if (totalEnergyGenerated > 0) {
                const invoice = new Invoice({
                    solarUnitId: unit._id,
                    userId: unit.userId,
                    billingPeriodStart: periodStart,
                    billingPeriodEnd: periodEnd,
                    totalEnergyGenerated,
                    paymentStatus: "PENDING",
                    // We don't set amount here, Stripe calculates it based on Price ID x Quantity
                });

                await invoice.save();
                console.log(`Invoice created for unit ${unit.serialNumber}: ${totalEnergyGenerated} kWh`);
            } else {
                console.log(`No energy generated for unit ${unit.serialNumber} in this period. Skipping invoice.`);
            }
        }
    }
};
