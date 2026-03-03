import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const inventory = await prisma.fBAInventory.findMany({
            include: {
                product: {
                    select: {
                        id: true,
                        skuCode: true,
                        productName: true,
                        amazonAsin: true,
                    }
                }
            }
        });

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const salesStats = await prisma.salesData.groupBy({
            by: ["productId"],
            where: {
                saleDate: { gte: sevenDaysAgo }
            },
            _sum: { unitsSold: true }
        });

        const salesMap = new Map(
            salesStats.map(s => [s.productId, (s._sum.unitsSold || 0) / 7])
        );

        const result = inventory.map(inv => {
            const velocity = salesMap.get(inv.productId) || 0;
            return {
                ...inv,
                velocity7d: velocity
            };
        });

        return NextResponse.json({ inventory: result });
    } catch (error) {
        console.error("GET /api/fba/inventory error:", error);
        return NextResponse.json({ error: "Failed to fetch FBA inventory" }, { status: 500 });
    }
}
