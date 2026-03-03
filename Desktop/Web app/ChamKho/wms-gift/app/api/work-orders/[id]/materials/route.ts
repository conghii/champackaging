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
                product: {
                    include: {
                        billOfMaterials: { include: { material: true } },
                    },
                },
            },
        });

        if (!wo) {
            return NextResponse.json({ error: "WO not found" }, { status: 404 });
        }

        const qtyPlanned = Number(wo.quantityPlanned);
        const materials = wo.product.billOfMaterials.map((bom) => {
            const required =
                Number(bom.quantityPerUnit) *
                qtyPlanned *
                (1 + Number(bom.wastagePercent) / 100);

            // We don't have an "actual material used" table per WO in the current schema design.
            // So we assume Actual = Planned for now, just to display the expected usage.
            // If we had a table tracking actual material deductions per WO, we'd query it here.
            return {
                materialId: bom.materialId,
                materialCode: bom.material.materialCode,
                materialName: bom.material.materialName,
                unit: bom.material.unit,
                plannedQty: Math.ceil(required),
                actualQty: Math.ceil(required), // Mocking actual for UI display per requirements
            };
        });

        return NextResponse.json({ materials });
    } catch (error) {
        console.error("GET /api/work-orders/[id]/materials error:", error);
        return NextResponse.json(
            { error: "Failed to fetch WO materials" },
            { status: 500 }
        );
    }
}
