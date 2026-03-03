import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { receivedItems } = body;
        // receivedItems: Array<{ itemId: string, receivedQty: number }>

        if (!Array.isArray(receivedItems) || receivedItems.length === 0) {
            return NextResponse.json({ error: "Dữ liệu nhận hàng không hợp lệ" }, { status: 400 });
        }

        const po = await prisma.purchaseOrder.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!po) {
            return NextResponse.json({ error: "PO not found" }, { status: 404 });
        }

        if (po.status !== "IN_TRANSIT" && po.status !== "PARTIALLY_RECEIVED") {
            return NextResponse.json(
                { error: `Không thể nhận hàng khi PO đang ở trạng thái ${po.status}` },
                { status: 400 }
            );
        }

        // Process each item
        let allFullyReceived = true;

        for (const ri of receivedItems) {
            const item = po.items.find((i) => i.id === ri.itemId);
            if (!item) continue;

            const newReceivedQty = Number(item.receivedQty) + ri.receivedQty;

            // Update PO item received qty
            await prisma.purchaseOrderItem.update({
                where: { id: ri.itemId },
                data: { receivedQty: newReceivedQty },
            });

            // Update material stock
            if (ri.receivedQty > 0) {
                await prisma.material.update({
                    where: { id: item.materialId },
                    data: {
                        currentStock: {
                            increment: ri.receivedQty,
                        },
                    },
                });
            }

            if (newReceivedQty < Number(item.quantity)) {
                allFullyReceived = false;
            }
        }

        // Check items not in receivedItems
        for (const item of po.items) {
            if (!receivedItems.find((ri: { itemId: string }) => ri.itemId === item.id)) {
                if (Number(item.receivedQty) < Number(item.quantity)) {
                    allFullyReceived = false;
                }
            }
        }

        // Update PO status
        const newStatus = allFullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";
        const updated = await prisma.purchaseOrder.update({
            where: { id },
            data: { status: newStatus },
            include: {
                items: { include: { material: true } },
                supplier: true,
            },
        });

        return NextResponse.json({
            po: updated,
            message: allFullyReceived
                ? "Đã nhận đủ tất cả hàng"
                : "Đã nhận một phần hàng",
        });
    } catch (error) {
        console.error("POST /api/purchase-orders/[id]/receive error:", error);
        return NextResponse.json({ error: "Không thể xử lý nhận hàng" }, { status: 500 });
    }
}
