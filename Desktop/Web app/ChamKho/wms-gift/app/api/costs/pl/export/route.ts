import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // YYYY-MM

        if (!month) return new NextResponse("Thiếu tham số 'month'", { status: 400 });

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

        let csvContent = "\uFEFFSKU,Tên SP,Units Bán,Doanh Thu,COGS,Gross Profit,FBA Fees,Net Profit,Margin %\n";

        let sumRev = 0, sumCogs = 0, sumGross = 0, sumFba = 0, sumNet = 0;

        products.forEach(p => {
            const totalUnitsSold = p.salesData.reduce((sum, s) => sum + s.unitsSold, 0);
            const totalRevenue = p.salesData.reduce((sum, s) => sum + Number(s.revenue), 0);

            if (totalUnitsSold === 0 && p.status !== "ACTIVE") return;

            let rawMaterialCost = 0;
            p.billOfMaterials.forEach(bom => {
                rawMaterialCost += Number(bom.quantityPerUnit) * Number(bom.material.avgUnitCost);
            });

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

            const unitCogs = rawMaterialCost + laborCostPerUnit + avgShippingCogs;
            const totalCogs = unitCogs * totalUnitsSold;

            const grossProfit = totalRevenue - totalCogs;

            const fbaFulfillment = Number(p.fba_fulfillment_fee || 0);
            const fbaStorage = Number(p.fba_storage_fee || 0);
            const refFeePct = Number(p.amazon_referral_pct || 15) / 100;

            const totalRefFee = totalRevenue * refFeePct;
            const totalFbaFulfillment = fbaFulfillment * totalUnitsSold;
            const totalFbaFees = totalRefFee + totalFbaFulfillment + fbaStorage;

            const netProfit = grossProfit - totalFbaFees;
            const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

            sumRev += totalRevenue;
            sumCogs += totalCogs;
            sumGross += grossProfit;
            sumFba += totalFbaFees;
            sumNet += netProfit;

            const safeName = `"${p.productName.replace(/"/g, '""')}"`;
            csvContent += `${p.skuCode},${safeName},${totalUnitsSold},${totalRevenue.toFixed(2)},${totalCogs.toFixed(2)},${grossProfit.toFixed(2)},${totalFbaFees.toFixed(2)},${netProfit.toFixed(2)},${margin.toFixed(2)}%\n`;
        });

        const totalMargin = sumRev > 0 ? (sumNet / sumRev) * 100 : 0;
        csvContent += `TỔNG CỘNG,, ,${sumRev.toFixed(2)},${sumCogs.toFixed(2)},${sumGross.toFixed(2)},${sumFba.toFixed(2)},${sumNet.toFixed(2)},${totalMargin.toFixed(2)}%\n`;

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="PL-${month}.csv"`,
            }
        });
    } catch (error) {
        console.error("GET /api/costs/pl/export error:", error);
        return new NextResponse("Failed to export P&L", { status: 500 });
    }
}
