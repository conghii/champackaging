import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const activities: any[] = [];

        // Wo Created
        const wosCreated = await prisma.workOrder.findMany({
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { product: { select: { skuCode: true } } }
        });
        wosCreated.forEach(wo => {
            activities.push({
                id: `woc_${wo.id}`,
                type: "WO_CREATED",
                title: `Tạo lệnh SX ${wo.woNumber} — ${wo.quantityPlanned} x ${wo.product.skuCode}`,
                timestamp: wo.createdAt,
                icon: "🏭",
                color: "text-blue-600 bg-blue-50"
            });
        });

        // Wo Completed
        const wosCompleted = await prisma.workOrder.findMany({
            where: { status: "COMPLETED" },
            orderBy: { actualEnd: "desc" },
            take: 5,
            include: { product: { select: { skuCode: true } } }
        });
        wosCompleted.forEach(wo => {
            if (wo.actualEnd) {
                activities.push({
                    id: `wocp_${wo.id}`,
                    type: "WO_COMPLETED",
                    title: `Hoàn thành ${wo.woNumber} — ${wo.quantityCompleted} units`,
                    timestamp: wo.actualEnd,
                    icon: "✅",
                    color: "text-emerald-600 bg-emerald-50"
                });
            }
        });

        // PO Received
        const poItems = await prisma.purchaseOrderItem.findMany({
            where: { quantityReceived: { gt: 0 } },
            orderBy: { purchaseOrder: { actualDelivery: "desc" } },
            take: 5,
            include: {
                material: { select: { materialName: true } },
                purchaseOrder: { select: { poNumber: true, actualDelivery: true } }
            }
        });
        poItems.forEach(poi => {
            if (poi.purchaseOrder.actualDelivery) {
                activities.push({
                    id: `po_${poi.id}`,
                    type: "PO_RECEIVED",
                    title: `Nhận hàng ${poi.purchaseOrder.poNumber} — ${poi.quantityReceived} ${poi.material.materialName}`,
                    timestamp: poi.purchaseOrder.actualDelivery,
                    icon: "📦",
                    color: "text-purple-600 bg-purple-50"
                });
            }
        });

        // Shipments
        const shipments = await prisma.fBAShipment.findMany({
            where: { status: "LIVE" },
            orderBy: { createdAt: "desc" }, // Wait, no updatedAt on FBAShipment in schema. We'll use createdAt for now or just generic if missing.
            // Ah, FBAShipment only has createdAt. Let's just use createdAt.
            take: 5
        });
        shipments.forEach(s => {
            activities.push({
                id: `ship_${s.id}`,
                type: "FBA_LIVE",
                title: `Lô hàng ${s.shipmentName} đã live trên Amazon`,
                timestamp: s.createdAt,
                icon: "🚀",
                color: "text-orange-600 bg-orange-50"
            });
        });

        // Sort by timestamp desc and take top 10
        activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        return NextResponse.json({
            activity: activities.slice(0, 10)
        });
    } catch (error) {
        console.error("GET /api/dashboard/activity error:", error);
        return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
    }
}
