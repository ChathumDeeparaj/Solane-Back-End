import express from "express";
import { Invoice } from "../infrastructure/entities/Invoice";
import { authenticationMiddleware } from "./middlewares/authentication-middleware";
import { User } from "../infrastructure/entities/User";

const router = express.Router();

// Get invoices for authenticated user
router.get("/", authenticationMiddleware, async (req: any, res) => {
    try {
        // Find the user in our DB using clerkUserId from auth middleware
        const user = await User.findOne({ clerkUserId: req.auth.userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const invoices = await Invoice.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .populate("solarUnitId", "serialNumber"); // Optional: populate unit details

        res.json(invoices);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// Get single invoice details
router.get("/:id", authenticationMiddleware, async (req: any, res) => {
    try {
        const user = await User.findOne({ clerkUserId: req.auth.userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const invoice = await Invoice.findOne({
            _id: req.params.id,
            userId: user._id
        }).populate("solarUnitId");

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        res.json(invoice);
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// Admin Route: List all invoices
// Note: Requires admin check. Assuming authenticationMiddleware populates user or we check role.
// For now, I'll add a basic role check helper or just fetch all if logic allows.
// The user prompt asked to add `GET /api/admin/invoices` - I'll put it in a separate admin router or here with check.
// I see `role` in User model.

export const adminInvoiceRouter = express.Router();

adminInvoiceRouter.get("/invoices", authenticationMiddleware, async (req: any, res) => {
    try {
        const user = await User.findOne({ clerkUserId: req.auth.userId });
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: "Access denied" });
        }

        const { status } = req.query;
        let query: any = {};
        if (status && status !== 'All') {
            query.paymentStatus = status;
        }

        const invoices = await Invoice.find(query)
            .sort({ createdAt: -1 })
            .populate("userId", "firstName lastName email")
            .populate("solarUnitId", "serialNumber");

        res.json(invoices);
    } catch (error) {
        console.error("Admin invoice fetch error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});


export default router;
