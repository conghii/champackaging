import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const updated = await prisma.fBAInventory.update({
            where: { id },
            data: {
                fulfillableQty: Number(body.fulfillableQty),
                inboundQty: Number(body.inboundQty),
                reservedQty: Number(body.reservedQty),
                updatedDate: new Date(),
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PUT /api/fba/inventory/[id] error:", error);
        return NextResponse.json({ error: "Failed to update FBA inventory" }, { status: 500 });
    }
}
