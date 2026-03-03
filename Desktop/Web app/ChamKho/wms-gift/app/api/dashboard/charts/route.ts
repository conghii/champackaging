import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Sales 30 Days Chart
        const salesRecords = await prisma.salesData.findMany({
            where: { saleDate: { gte: thirtyDaysAgo } },
            select: { saleDate: true, unitsSold: true, revenue: true }
        });

        const salesMap: Record<string, { date: string; units: number; revenue: number }> = {};
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const k = d.toISOString().split("T")[0];
            salesMap[k] = { date: k, units: 0, revenue: 0 };
        }

        for (const r of salesRecords) {
            const d = new Date(r.saleDate).toISOString().split("T")[0];
            if (salesMap[d]) {
                salesMap[d].units += r.unitsSold;
                salesMap[d].revenue += Number(r.revenue);
            }
        }

        const salesChart = Object.values(salesMap).sort((a, b) => a.date.localeCompare(b.date));

        // 2. FBA Stock Chart
        const fbaInv = await prisma.fBAInventory.findMany({
            include: {
                product: {
                    include: {
                        salesData: { where: { saleDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }
                    }
                }
            }
        });

        const stockChart = fbaInv.map(inv => {
            const v7 = inv.product.salesData.reduce((acc, s) => acc + s.unitsSold, 0) / 7;
            const days = v7 > 0 ? Math.floor(inv.fulfillableQty / v7) : 999;

            return {
                sku: inv.product.skuCode,
                productName: inv.product.productName,
                fulfillableQty: inv.fulfillableQty,
                velocity: v7,
                daysOfSupply: days,
                fill: days < 14 ? "#EF4444" : days < 30 ? "#F59E0B" : "#10B981"
            };
        }).sort((a, b) => a.daysOfSupply - b.daysOfSupply);

        return NextResponse.json({
            salesChart,
            stockChart
        });
    } catch (error) {
        console.error("GET /api/dashboard/charts error:", error);
        return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 });
    }
}
