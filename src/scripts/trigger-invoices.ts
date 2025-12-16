import "dotenv/config";
import { connectDB } from "../infrastructure/db";
import { generateInvoices } from "../application/background/generate-invoices";
import mongoose from "mongoose";

const run = async () => {
    console.log("Connecting to DB...");
    await connectDB();
    console.log("Connected. Triggering invoice generation...");

    try {
        await generateInvoices();
        console.log("Done.");
    } catch (error) {
        console.error("Error generating invoices:", error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

run();
