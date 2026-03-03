import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const today = new Date();

        // We get all POs that are not fully paid
        const purchaseOrders = await prisma.purchaseOrder.findMany({
            where: {
                paymentStatus: { not: "FULLY_PAID" }
            },
            include: {
                supplier: true
            },
            orderBy: {
                expectedDelivery: "asc"
            }
        });

        // Determine the due date for each PO (assuming due on expected_delivery or + X days logically)
        // The requirement says "Hạn thanh toán", we'll just use expectedDelivery as due date

        let total30 = 0;
        let total31_60 = 0;
        let total61_90 = 0;

        const items = purchaseOrders.map(po => {
            // Base the due date on expectedDelivery, defaulting to created date if not set
            const dueDate = po.expectedDelivery ? new Date(po.expectedDelivery) : new Date(po.createdAt);

            const diffTime = dueDate.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const amount = Number(po.totalAmount);

            let period = "";
            if (diffDays <= 30) {
                period = "30";
                total30 += amount;
            } else if (diffDays <= 60) {
                period = "60";
                total31_60 += amount;
            } else if (diffDays <= 90) {
                period = "90";
                total61_90 += amount;
            } else {
                period = "future";
            }

            return {
                id: po.id,
                poNumber: po.poNumber,
                supplierName: po.supplier.supplierName,
                totalAmount: amount,
                paidAmount: 0, // Assumption for mockup, as there's no partial tracking yet unless we use another model
                remainingAmount: amount,
                dueDate: dueDate.toISOString(),
                paymentStatus: po.paymentStatus,
                daysUntilDue: diffDays,
                period
            };
        }).filter(po => po.period !== "future"); // Focus on 90 days

        return NextResponse.json({
            summary: {
                total30,
                total31_60,
                total61_90,
                total90: total30 + total31_60 + total61_90
            },
            items
        });
    } catch (error) {
        console.error("GET /api/costs/cashflow error:", error);
        return NextResponse.json({ error: "Failed to fetch cash flow" }, { status: 500 });
    }
}
