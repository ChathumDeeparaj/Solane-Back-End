import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
    {
        solarUnitId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SolarUnit",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        billingPeriodStart: {
            type: Date,
            required: true,
        },
        billingPeriodEnd: {
            type: Date,
            required: true,
        },
        totalEnergyGenerated: {
            type: Number,
            required: true,
        },
        paymentStatus: {
            type: String,
            enum: ["PENDING", "PAID", "FAILED"],
            default: "PENDING",
            required: true,
        },
        paidAt: {
            type: Date,
        },
        // Optional: Amount in cents or calculated logic? 
        // User instruction says "pricing in Stripe Dashboard (per kWh rate)"
        // So we primarily track energy here.
    },
    { timestamps: true }
);

export const Invoice = mongoose.model("Invoice", invoiceSchema);
