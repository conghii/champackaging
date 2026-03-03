import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Valid state transitions
const TRANSITIONS: Record<string, string> = {
    DRAFT: "SENT",
    SENT: "CONFIRMED",
    CONFIRMED: "IN_TRANSIT",
    IN_TRANSIT: "RECEIVED", // or PARTIALLY_RECEIVED via /receive
    RECEIVED: "CLOSED",
    PARTIALLY_RECEIVED: "RECEIVED", // can transition again after more receiving
};

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { targetStatus } = body;

        const po = await prisma.purchaseOrder.findUnique({ where: { id } });
        if (!po) {
            return NextResponse.json({ error: "PO not found" }, { status: 404 });
        }

        // Validate transition
        const allowedNext = TRANSITIONS[po.status];
        if (allowedNext !== targetStatus) {
            return NextResponse.json(
                {
                    error: `Không thể chuyển từ ${po.status} sang ${targetStatus}. Trạng thái tiếp theo hợp lệ: ${allowedNext || "none"}`,
                },
                { status: 400 }
            );
        }

        const updated = await prisma.purchaseOrder.update({
            where: { id },
            data: { status: targetStatus },
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("POST /api/purchase-orders/[id]/transition error:", error);
        return NextResponse.json({ error: "Không thể đổi trạng thái" }, { status: 500 });
    }
}
