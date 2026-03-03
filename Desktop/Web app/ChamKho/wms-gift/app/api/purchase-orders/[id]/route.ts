import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
                supplier: true,
                items: {
                    include: { material: true },
                    orderBy: { material: { materialCode: "asc" } },
                },
            },
        });

        if (!po) {
            return NextResponse.json({ error: "PO not found" }, { status: 404 });
        }

        return NextResponse.json({ po });
    } catch (error) {
        console.error("GET /api/purchase-orders/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch PO" }, { status: 500 });
    }
}
