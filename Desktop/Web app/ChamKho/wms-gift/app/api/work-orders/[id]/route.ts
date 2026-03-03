import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const wo = await prisma.workOrder.findUnique({
            where: { id },
            include: {
                product: true,
                shifts: {
                    include: { employee: true },
                    orderBy: { date: "desc" },
                },
            },
        });

        if (!wo) {
            return NextResponse.json({ error: "WO not found" }, { status: 404 });
        }

        return NextResponse.json({ wo });
    } catch (error) {
        console.error("GET /api/work-orders/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch WO" }, { status: 500 });
    }
}
