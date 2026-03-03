import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const supplierId = searchParams.get("supplierId") || "";
        const status = searchParams.get("status") || "";
        const month = searchParams.get("month") || ""; // YYYY-MM

        const where: Record<string, unknown> = {};
        if (supplierId) where.supplierId = supplierId;
        if (status) where.status = status;
        if (month) {
            const [y, m] = month.split("-").map(Number);
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 1);
            where.createdAt = { gte: start, lt: end };
        }

        const orders = await prisma.purchaseOrder.findMany({
            where: where as never,
            include: {
                supplier: { select: { supplierName: true, supplierCode: true } },
                _count: { select: { items: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ orders });
    } catch (error) {
        console.error("GET /api/purchase-orders error:", error);
        return NextResponse.json({ error: "Failed to fetch POs" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Generate PO number
        const count = await prisma.purchaseOrder.count();
        const year = new Date().getFullYear();
        const poNumber = `PO-${year}-${String(count + 1).padStart(3, "0")}`;

        const po = await prisma.purchaseOrder.create({
            data: {
                poNumber,
                supplierId: body.supplierId,
                status: "DRAFT",
                paymentStatus: "UNPAID",
                totalAmount: body.totalAmount || 0,
                currency: body.currency || "VND",
                expectedDelivery: body.expectedDelivery ? new Date(body.expectedDelivery) : null,
                shippingMethod: body.shippingMethod || null,
                notes: body.notes || null,
                items: {
                    create: (body.items || []).map(
                        (item: { materialId: string; quantity: number; unitPrice: number }) => ({
                            materialId: item.materialId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            receivedQty: 0,
                        })
                    ),
                },
            },
            include: {
                items: { include: { material: true } },
                supplier: true,
            },
        });

        return NextResponse.json(po, { status: 201 });
    } catch (error) {
        console.error("POST /api/purchase-orders error:", error);
        return NextResponse.json({ error: "Không thể tạo PO" }, { status: 400 });
    }
}
