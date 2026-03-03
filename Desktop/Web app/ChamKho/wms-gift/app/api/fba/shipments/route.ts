import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "";

        const where: any = {};
        if (status) where.status = status;

        const shipments = await prisma.fBAShipment.findMany({
            where,
            include: {
                items: {
                    include: {
                        product: { select: { skuCode: true, productName: true } }
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json({ shipments });
    } catch (error) {
        console.error("GET /api/fba/shipments error:", error);
        return NextResponse.json({ error: "Failed to fetch shipments" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const shipment = await prisma.$transaction(async (tx) => {
            let totalUnits = 0;
            for (const item of body.items) {
                totalUnits += Number(item.quantity) || 0;
            }

            const s = await tx.fBAShipment.create({
                data: {
                    shipmentName: body.shipmentName,
                    destinationFc: body.destinationFc,
                    shipDate: body.shipDate ? new Date(body.shipDate) : null,
                    totalUnits,
                    shippingCost: Number(body.shippingCost) || 0,
                    status: "PLANNING",
                }
            });

            for (const item of body.items) {
                await tx.fBAShipmentItem.create({
                    data: {
                        shipmentId: s.id,
                        productId: item.productId,
                        quantity: Number(item.quantity),
                    }
                });
            }

            return s;
        });

        return NextResponse.json(shipment, { status: 201 });
    } catch (error) {
        console.error("POST /api/fba/shipments error:", error);
        return NextResponse.json({ error: "Failed to create shipment" }, { status: 500 });
    }
}
