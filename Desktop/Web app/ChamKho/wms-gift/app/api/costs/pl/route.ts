import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // YYYY-MM

        if (!month) return NextResponse.json({ error: "Missing month parameter" }, { status: 400 });

        const [y, m] = month.split("-").map(Number);
        const startDate = new Date(y, m - 1, 1);
        const endDate = new Date(y, m, 1);

        const products = await prisma.product.findMany({
            include: {
                salesData: {
                    where: { saleDate: { gte: startDate, lt: endDate } }
                },
                billOfMaterials: { include: { material: true } }
            }
        });

        // To compute accurate COGS for each product, we need the labor cost logic over again or simplified 
        // for this read-only dashboard. Let's get the generic monthly averages.
        const attendances = await prisma.attendance.findMany({
            where: {
                workDate: { gte: startDate, lt: endDate },
                employee: { role: "PRODUCTION" }
            },
            include: { employee: true }
        });

        let totalLaborCostThisMonth = 0;
        let totalUnitsCompletedThisMonth = 0;
        attendances.forEach(a => {
            const base = Number(a.employee.baseSalary);
            if (a.employee.salaryType === "MONTHLY") {
                totalLaborCostThisMonth += (base / 26);
            } else if (a.employee.salaryType === "HOURLY") {
                totalLaborCostThisMonth += Number(a.hoursWorked) * (base / 160);
            } else {
                totalLaborCostThisMonth += Number(a.unitsCompleted) * base;
            }
            totalUnitsCompletedThisMonth += a.unitsCompleted;
        });

        const workOrdersThisMonth = await prisma.workOrder.findMany({
            where: { createdAt: { gte: startDate, lt: endDate } }
        });
        const totalWOUnits = workOrdersThisMonth.reduce((sum, w) => sum + w.quantityCompleted, 0);
        const finalDivisor = totalUnitsCompletedThisMonth > 0 ? totalUnitsCompletedThisMonth : (totalWOUnits > 0 ? totalWOUnits : 1);
        const laborCostPerUnit = totalLaborCostThisMonth / finalDivisor;

        const shipmentItems = await prisma.fBAShipmentItem.findMany({
            where: { shipment: { createdAt: { gte: startDate, lt: endDate } } },
            include: { shipment: true }
        });

        const plData = products.map(p => {
            // Only include if there's sales data OR they have active status

            const totalUnitsSold = p.salesData.reduce((sum, s) => sum + s.unitsSold, 0);
            const totalRevenue = p.salesData.reduce((sum, s) => sum + Number(s.revenue), 0);

            // Raw & packaging
            let rawMaterialCost = 0;
            p.billOfMaterials.forEach(bom => {
                rawMaterialCost += Number(bom.quantityPerUnit) * Number(bom.material.avgUnitCost);
            });

            // shipping
            const skuShipments = shipmentItems.filter(si => si.productId === p.id);
            let allocatedShipping = 0;
            let shippedUnits = 0;
            skuShipments.forEach(si => {
                if (si.shipment.totalUnits > 0) {
                    allocatedShipping += Number(si.shipment.shippingCost) * (si.quantity / si.shipment.totalUnits);
                    shippedUnits += si.quantity;
                }
            });
            const avgShippingCogs = shippedUnits > 0 ? allocatedShipping / shippedUnits : 0;

            // COGS per unit
            const unitCogs = rawMaterialCost + laborCostPerUnit + avgShippingCogs;
            const totalCogs = unitCogs * totalUnitsSold;

            const grossProfit = totalRevenue - totalCogs;

            const fbaFulfillment = Number(p.fba_fulfillment_fee || 0);
            const fbaStorage = Number(p.fba_storage_fee || 0); // treating as per unit for simplicity of display or total? user asks for "input tay ước tính/tháng" -> but on SKU level they inputs it. So let's multiply by units or treat as flat? I will multiply fulfillment by units, storage is flat monthly.
            const refFeePct = Number(p.amazon_referral_pct || 15) / 100;

            const totalRefFee = totalRevenue * refFeePct;
            const totalFbaFulfillment = fbaFulfillment * totalUnitsSold;
            const totalFbaFees = totalRefFee + totalFbaFulfillment + fbaStorage; // Storage applied flat per month per SKU

            const netProfit = grossProfit - totalFbaFees;
            const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

            return {
                id: p.id,
                skuCode: p.skuCode,
                productName: p.productName,
                unitsSold: totalUnitsSold,
                revenue: totalRevenue,
                cogs: totalCogs,
                grossProfit,
                fbaFees: totalFbaFees,
                netProfit,
                margin
            };
        });

        // sort by revenue
        plData.sort((a, b) => b.revenue - a.revenue);

        return NextResponse.json({
            month,
            data: plData
        });
    } catch (error) {
        console.error("GET /api/costs/pl error:", error);
        return NextResponse.json({ error: "Failed to fetch P&L" }, { status: 500 });
    }
}
