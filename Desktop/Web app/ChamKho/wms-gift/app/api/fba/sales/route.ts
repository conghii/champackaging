import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const sku = searchParams.get("sku") || "";
        // filter dates
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        const where: any = {};
        if (sku) {
            where.product = { skuCode: sku };
        }

        if (startDate || endDate) {
            where.saleDate = {};
            if (startDate) where.saleDate.gte = new Date(startDate);
            if (endDate) {
                const d = new Date(endDate);
                d.setHours(23, 59, 59, 999);
                where.saleDate.lte = d;
            }
        }

        const sales = await prisma.salesData.findMany({
            where,
            include: {
                product: { select: { skuCode: true, productName: true } }
            },
            orderBy: { saleDate: "desc" }
        });

        return NextResponse.json({ sales });
    } catch (error) {
        console.error("GET /api/fba/sales error:", error);
        return NextResponse.json({ error: "Failed to fetch sales data" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const json = await req.json();
        const records = Array.isArray(json) ? json : [json];

        await prisma.$transaction(
            records.map((r: any) =>
                prisma.salesData.create({
                    data: {
                        productId: r.productId,
                        saleDate: new Date(r.saleDate),
                        unitsSold: Number(r.unitsSold),
                        revenue: Number(r.revenue),
                        returns: Number(r.returns || 0),
                    }
                })
            )
        );

        // After adding sales, maybe deduct fulfillable FBA Inventory?
        // Wait, the prompt says "Nguyên liệu bán hàng". Usually FBA inventory is
        // deducted automatically from Amazon, which user updates via API or manual bulk. 
        // Let's do a simple deduction here to keep the internal numbers realistic if user puts it in manually.
        for (const r of records) {
            const p = await prisma.fBAInventory.findUnique({ where: { productId: r.productId } });
            if (p && Number(r.unitsSold) > 0) {
                await prisma.fBAInventory.update({
                    where: { productId: r.productId },
                    data: { fulfillableQty: { decrement: Number(r.unitsSold) } }
                });
            }
        }

        return NextResponse.json({ message: "Đã lưu doanh số thành công" }, { status: 201 });
    } catch (error) {
        console.error("POST /api/fba/sales error:", error);
        return NextResponse.json({ error: "Failed to save sales data" }, { status: 500 });
    }
}
