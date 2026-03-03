import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const shipment = await prisma.fBAShipment.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: { skuCode: true, productName: true, amazonFnsku: true }
                        }
                    }
                }
            }
        });

        if (!shipment) {
            return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
        }

        return NextResponse.json({ shipment });
    } catch (error) {
        console.error("GET /api/fba/shipments/[id] error:", error);
        return NextResponse.json({ error: "Failed to fetch shipment" }, { status: 500 });
    }
}
