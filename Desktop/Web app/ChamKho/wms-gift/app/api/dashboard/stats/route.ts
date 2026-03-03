import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const firstDayOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

        // 1. Sales Today & Yesterday
        const [salesToday, salesYesterday] = await Promise.all([
            prisma.salesData.aggregate({
                _sum: { revenue: true, unitsSold: true },
                where: { saleDate: { gte: today } }
            }),
            prisma.salesData.aggregate({
                _sum: { revenue: true, unitsSold: true },
                where: { saleDate: { gte: yesterday, lt: today } }
            })
        ]);

        const revenueToday = Number(salesToday._sum.revenue || 0);
        const unitsToday = salesToday._sum.unitsSold || 0;
        const revenueYest = Number(salesYesterday._sum.revenue || 0);

        let salesChangeStr = "0%";
        let salesChangeIsUp = true;
        if (revenueYest > 0) {
            const pct = ((revenueToday - revenueYest) / revenueYest) * 100;
            salesChangeStr = `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
            salesChangeIsUp = pct >= 0;
        } else if (revenueToday > 0) {
            salesChangeStr = "+100%";
        }

        // 2. FBA Stock
        const fbaData = await prisma.fBAInventory.findMany({
            include: { product: { include: { salesData: { where: { saleDate: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } } } } }
        });

        let totalFbaUnits = 0;
        let criticalSkus = 0;

        for (const inv of fbaData) {
            totalFbaUnits += inv.fulfillableQty;
            // calc velocity 7d
            const v7 = inv.product.salesData.reduce((acc, s) => acc + s.unitsSold, 0) / 7;
            const days = v7 > 0 ? inv.fulfillableQty / v7 : 999;
            if (days < 14) criticalSkus++;
        }

        // 3. Active Work Orders
        const wos = await prisma.workOrder.findMany({
            where: { status: "IN_PROGRESS" },
        });
        const activeWoCount = wos.length;
        const activeWoUnits = wos.reduce((acc, wo) => acc + wo.quantityPlanned, 0);
        const overdueWos = wos.filter(wo => wo.plannedEnd && new Date(wo.plannedEnd).getTime() < Date.now()).length;

        // 4. Low Materials
        const lowMats = await prisma.material.findMany({
            where: { currentStock: { lte: prisma.material.fields.minStock } },
            take: 1
        });
        const totalLowMats = await prisma.material.count({
            where: { currentStock: { lte: prisma.material.fields.minStock } }
        });

        // 5. Incoming POs
        const pos = await prisma.purchaseOrder.findMany({
            where: { status: { in: ["IN_TRANSIT", "CONFIRMED"] } },
            orderBy: { expectedDelivery: "asc" }
        });
        let daysToNearestPo = -1;
        if (pos[0]?.expectedDelivery) {
            daysToNearestPo = Math.ceil((new Date(pos[0].expectedDelivery).getTime() - Date.now()) / (1000 * 3600 * 24));
        }

        // 6. Monthly Revenue
        const [revThisMonth, revLastMonth] = await Promise.all([
            prisma.salesData.aggregate({
                _sum: { revenue: true },
                where: { saleDate: { gte: firstDayOfMonth } }
            }),
            prisma.salesData.aggregate({
                _sum: { revenue: true },
                where: { saleDate: { gte: firstDayOfLastMonth, lt: firstDayOfMonth } }
            })
        ]);

        const rTM = Number(revThisMonth._sum.revenue || 0);
        const rLM = Number(revLastMonth._sum.revenue || 0);

        let monthChangeStr = "0%";
        if (rLM > 0) {
            const pct = ((rTM - rLM) / rLM) * 100;
            monthChangeStr = `${pct > 0 ? "+" : ""}${pct.toFixed(1)}%`;
        } else if (rTM > 0) {
            monthChangeStr = "+100%";
        }

        return NextResponse.json({
            revenueToday,
            unitsToday,
            salesChangeStr,
            salesChangeIsUp,

            totalFbaUnits,
            totalFbaSkus: fbaData.length,
            criticalSkus,

            activeWoCount,
            activeWoUnits,
            overdueWos,

            totalLowMats,
            firstLowMatName: lowMats[0]?.materialName || null,

            incomingPoCount: pos.length,
            daysToNearestPo,

            revenueThisMonth: rTM,
            monthChangeStr,
            revenueTargetProgress: rLM > 0 ? Math.min(100, Math.round((rTM / rLM) * 100)) : 0
        });
    } catch (error) {
        console.error("GET /api/dashboard/stats error:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
