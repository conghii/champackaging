import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                billOfMaterials: {
                    include: { material: true }
                }
            }
        });

        if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        // 1. Raw Materials & Packaging Cost
        let rawMaterialCost = 0;
        let packagingCost = 0;

        product.billOfMaterials.forEach(bom => {
            const cost = Number(bom.quantityPerUnit) * Number(bom.material.avgUnitCost);
            if (bom.material.category?.toLowerCase() === "packaging") {
                packagingCost += cost;
            } else {
                rawMaterialCost += cost;
            }
        });

        // 2. Labor Cost
        // "Lấy từ attendance tháng này": Calculate avg labor cost per production unit this month
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        const attendances = await prisma.attendance.findMany({
            where: {
                workDate: { gte: startOfMonth, lte: endOfMonth },
                employee: { role: "PRODUCTION" }
            },
            include: { employee: true }
        });

        // Simplistic monthly wage breakdown for demonstration based on the previous module formulation
        let totalLaborCostThisMonth = 0;
        let totalUnitsCompletedThisMonth = 0;

        attendances.forEach(a => {
            const base = Number(a.employee.baseSalary);
            if (a.employee.salaryType === "MONTHLY") {
                totalLaborCostThisMonth += (base / 26); // day rate approx
            } else if (a.employee.salaryType === "HOURLY") {
                totalLaborCostThisMonth += Number(a.hoursWorked) * (base / 160);
            } else {
                totalLaborCostThisMonth += Number(a.unitsCompleted) * base;
            }
            totalUnitsCompletedThisMonth += a.unitsCompleted;
        });

        const workOrdersThisMonth = await prisma.workOrder.findMany({
            where: { createdAt: { gte: startOfMonth, lte: endOfMonth } }
        });
        const totalWOUnits = workOrdersThisMonth.reduce((sum, w) => sum + w.quantityCompleted, 0);
        const finalDivisor = totalUnitsCompletedThisMonth > 0 ? totalUnitsCompletedThisMonth : (totalWOUnits > 0 ? totalWOUnits : 1);

        const laborCostPerUnit = totalLaborCostThisMonth / finalDivisor;

        // 3. Shipping to Amazon (Average shipping cost per unit for this SKU in shipments)
        const shipmentItems = await prisma.fBAShipmentItem.findMany({
            where: { productId: id },
            include: { shipment: true }
        });

        let totalShippingCostAllocated = 0;
        let totalShippedUnits = 0;

        shipmentItems.forEach(item => {
            if (item.shipment.totalUnits > 0) {
                // Apportion shipping cost
                const proportion = item.quantity / item.shipment.totalUnits;
                totalShippingCostAllocated += Number(item.shipment.shippingCost) * proportion;
                totalShippedUnits += item.quantity;
            }
        });

        const averageShippingCost = totalShippedUnits > 0 ? totalShippingCostAllocated / totalShippedUnits : 0;

        // 4. FBA Fees
        const fbaFulfillment = Number(product.fba_fulfillment_fee || 0);
        const fbaStorage = Number(product.fba_storage_fee || 0);
        const amazonReferral = (Number(product.amazon_referral_pct || 15) / 100) * Number(product.sellingPrice);

        const totalCogs = rawMaterialCost + packagingCost + laborCostPerUnit + averageShippingCost + fbaFulfillment + fbaStorage + amazonReferral;
        const grossProfit = Number(product.sellingPrice) - totalCogs;
        const margin = Number(product.sellingPrice) > 0 ? (grossProfit / Number(product.sellingPrice)) * 100 : 0;

        return NextResponse.json({
            product: {
                id: product.id,
                skuCode: product.skuCode,
                productName: product.productName,
                sellingPrice: Number(product.sellingPrice),
                fbaFulfillment,
                fbaStorage,
                amazonReferralPct: Number(product.amazon_referral_pct)
            },
            breakdown: {
                rawMaterial: rawMaterialCost,
                packaging: packagingCost,
                labor: laborCostPerUnit,
                shipping: averageShippingCost,
                fbaFulfillment,
                fbaStorage,
                amazonReferral
            },
            summary: {
                totalCogs,
                grossProfit,
                margin
            }
        });

    } catch (error) {
        console.error("GET /api/costs/sku/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch SKU costs" }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const product = await prisma.product.update({
            where: { id },
            data: {
                fba_fulfillment_fee: body.fbaFulfillment,
                fba_storage_fee: body.fbaStorage,
                amazon_referral_pct: body.amazonReferralPct
            }
        });
        return NextResponse.json({ success: true, product });
    } catch (error) {
        console.error("PUT /api/costs/sku/[id] error:", error);
        return NextResponse.json({ error: "Failed to update FBA fees" }, { status: 500 });
    }
}
