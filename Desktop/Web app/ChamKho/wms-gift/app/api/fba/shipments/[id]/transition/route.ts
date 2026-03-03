import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const TRANSITIONS: Record<string, string[]> = {
    PLANNING: ["LABELING"],
    LABELING: ["READY_TO_SHIP"],
    READY_TO_SHIP: ["SHIPPED"],
    SHIPPED: ["IN_TRANSIT"],
    IN_TRANSIT: ["DELIVERED"],
    DELIVERED: ["RECEIVING"],
    RECEIVING: ["LIVE"],
    LIVE: ["CLOSED"],
};

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { targetStatus, trackingNumber, shipDate, shippingCost, receivedUnitsMap } = body;

        const ship = await prisma.fBAShipment.findUnique({
            where: { id },
            include: { items: true }
        });

        if (!ship) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });

        const allowed = TRANSITIONS[ship.status] || [];
        if (!allowed.includes(targetStatus)) {
            return NextResponse.json({ error: `Không thể chuyển từ ${ship.status} sang ${targetStatus}` }, { status: 400 });
        }

        const updateData: any = { status: targetStatus };

        // When moving to SHIPPED
        if (ship.status === "READY_TO_SHIP" && targetStatus === "SHIPPED") {
            if (trackingNumber) updateData.trackingNumber = trackingNumber;
            if (shipDate) updateData.shipDate = new Date(shipDate);
            if (shippingCost !== undefined) updateData.shippingCost = Number(shippingCost);
        }

        // When moving to LIVE, amazon confirmed items.
        // receivedUnitsMap: { [productId]: numberToReceive }
        if (ship.status === "RECEIVING" && targetStatus === "LIVE") {
            await prisma.$transaction(async (tx) => {
                for (const item of ship.items) {
                    const shippedQty = item.quantity;
                    const mapQty = receivedUnitsMap?.[item.productId];
                    const receivedQty = mapQty !== undefined ? Number(mapQty) : shippedQty; // Default to full shipped qty if not provided

                    // Deduct from inbound logic: in a real system we deduct exact shipped amount 
                    // from inbound and add actual received to fulfillable.
                    const fbaInv = await tx.fBAInventory.findUnique({ where: { productId: item.productId } });
                    if (fbaInv) {
                        const newInbound = Math.max(0, fbaInv.inboundQty - shippedQty); // prevent negative inbound
                        await tx.fBAInventory.update({
                            where: { productId: item.productId },
                            data: {
                                inboundQty: newInbound,
                                fulfillableQty: { increment: receivedQty }
                            }
                        });
                    }
                }
                await tx.fBAShipment.update({ where: { id }, data: updateData });
            });
            return NextResponse.json({ message: "Inbound quantity removed and Fulfillable increased." });
        }

        const updated = await prisma.fBAShipment.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("POST /api/fba/shipments/[id]/transition error:", error);
        return NextResponse.json({ error: "Failed status transition" }, { status: 500 });
    }
}
