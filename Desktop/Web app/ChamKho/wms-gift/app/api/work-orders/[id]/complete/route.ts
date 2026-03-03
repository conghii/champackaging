import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { quantityCompleted, quantityRejected } = body;

        const wo = await prisma.workOrder.findUnique({ where: { id } });
        if (!wo) {
            return NextResponse.json({ error: "WO not found" }, { status: 404 });
        }

        if (wo.status !== "PACKAGING") {
            return NextResponse.json(
                { error: "WO phải ở bước đóng gói mới có thể hoàn thành" },
                { status: 400 }
            );
        }

        const qtyC = Number(quantityCompleted) || 0;
        const qtyR = Number(quantityRejected) || 0;

        await prisma.$transaction(async (tx) => {
            // Update WO
            await tx.workOrder.update({
                where: { id },
                data: {
                    status: "COMPLETED",
                    quantityCompleted: qtyC,
                    quantityRejected: qtyR,
                    actualEndDate: new Date(),
                },
            });

            // Update FBA Inventory (Inbound)
            const fba = await tx.fBAInventory.findUnique({
                where: { productId: wo.productId },
            });

            if (fba) {
                await tx.fBAInventory.update({
                    where: { productId: wo.productId },
                    data: { inboundQty: { increment: qtyC } },
                });
            } else {
                await tx.fBAInventory.create({
                    data: {
                        productId: wo.productId,
                        fulfillableQty: 0,
                        inboundQty: qtyC,
                        reservedQty: 0,
                    },
                });
            }
        });

        return NextResponse.json({ message: "WO hoàn thành, đã cập nhật Inbound FBA" });
    } catch (error) {
        console.error("POST /api/work-orders/[id]/complete error:", error);
        return NextResponse.json({ error: "Lỗi hoàn thành WO" }, { status: 500 });
    }
}
