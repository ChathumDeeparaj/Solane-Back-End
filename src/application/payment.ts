import Stripe from "stripe";
import { Request, Response } from "express";
import { Invoice } from "../infrastructure/entities/Invoice";

// 7.1 Initialize Stripe SDK
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// 7.2 Create Checkout Session Endpoint
export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        const { invoiceId } = req.body;

        // 1. Get invoice (use your existing auth + query patterns)
        // We assume authentication middleware has run and we might check userId here if strict security is needed,
        // but the invoiceId is specific enough for this step, plus we check paymentStatus.

        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            // Using basic error handling for now matching the snippet style
            // In real app, we might use next(new NotFoundError(...))
            return res.status(404).json({ message: "Invoice not found" });
        }

        if (invoice.paymentStatus === "PAID") {
            return res.status(400).json({ message: "Invoice already paid" });
        }

        // 2. Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            ui_mode: "embedded",
            line_items: [
                {
                    price: process.env.STRIPE_PRICE_ID, // Your Price ID from Dashboard
                    quantity: Math.round(invoice.totalEnergyGenerated), // kWh as quantity
                },
            ],
            mode: "payment",
            return_url: `${process.env.FRONTEND_URL}/dashboard/invoices/complete?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                invoiceId: invoice._id.toString(), // Critical: links session to your invoice
            },
        });

        // 3. Return client secret to frontend
        res.json({ clientSecret: session.client_secret });
    } catch (error: any) {
        console.error("Create Invoice Session Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 7.3 Get Session Status Endpoint
export const getSessionStatus = async (req: Request, res: Response) => {
    try {
        const { session_id } = req.query;

        if (!session_id) {
            return res.status(400).json({ message: "Session ID required" });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id as string);

        res.json({
            status: session.status,
            paymentStatus: session.payment_status,
            amountTotal: session.amount_total, // Amount in cents
        });
    } catch (error: any) {
        console.error("Get Session Status Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// 8.2 Webhook Handler
export const handleStripeWebhook = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    let event: Stripe.Event;

    // 1. Verify webhook signature (SECURITY: proves request is from Stripe)
    try {
        event = stripe.webhooks.constructEvent(
            req.body, // Must be raw body, not parsed JSON
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // 2. Handle payment completion
    if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const invoiceId = session.metadata?.invoiceId;

        if (invoiceId && session.payment_status === "paid") {
            await Invoice.findByIdAndUpdate(invoiceId, {
                paymentStatus: "PAID",
                paidAt: new Date(),
            });
            console.log("Invoice marked as PAID:", invoiceId);
        }
    }

    // 3. Always return 200 to acknowledge receipt
    res.status(200).json({ received: true });
};
