import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const TRANSITIONS: Record<string, string[]> = {
    DRAFT: ["PENDING"],
    PENDING: ["IN_PROGRESS"],
    IN_PROGRESS: ["PAUSED", "QC_CHECK"],
    PAUSED: ["IN_PROGRESS"],
    QC_CHECK: ["PACKAGING", "IN_PROGRESS"], // pass -> packaging, fail -> in_progress
    PACKAGING: [], // Complete goes through a separate endpoint to handle FBA stock
};

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { targetStatus } = body;

        const wo = await prisma.workOrder.findUnique({
            where: { id },
            include: {
                product: { include: { billOfMaterials: { include: { material: true } } } },
            },
        });

        if (!wo) {
            return NextResponse.json({ error: "WO not found" }, { status: 404 });
        }

        const allowed = TRANSITIONS[wo.status] || [];
        if (!allowed.includes(targetStatus)) {
            return NextResponse.json(
                { error: `Không thể chuyển từ ${wo.status} sang ${targetStatus}` },
                { status: 400 }
            );
        }

        const updateData: any = { status: targetStatus };

        // Set actual start date when first moving to IN_PROGRESS
        if (targetStatus === "IN_PROGRESS" && !wo.actualStartDate) {
            updateData.actualStartDate = new Date();
        }

        // Material deduction logic when moving PENDING -> IN_PROGRESS
        if (wo.status === "PENDING" && targetStatus === "IN_PROGRESS") {
            const qtyPlanned = Number(wo.quantityPlanned);

            // Perform stock deductions in a transaction
            await prisma.$transaction(async (tx) => {
                for (const bom of wo.product.billOfMaterials) {
                    const required =
                        Number(bom.quantityPerUnit) *
                        qtyPlanned *
                        (1 + Number(bom.wastagePercent) / 100);

                    await tx.material.update({
                        where: { id: bom.materialId },
                        data: { currentStock: { decrement: Math.ceil(required) } },
                    });
                }

                await tx.workOrder.update({
                    where: { id },
                    data: updateData,
                });
            });

            return NextResponse.json({ message: "Đã xuất nguyên liệu và bắt đầu SX" });
        }

        // Standard state transition
        const updated = await prisma.workOrder.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("POST /api/work-orders/[id]/transition error:", error);
        return NextResponse.json(
            { error: "Lỗi chuyển trạng thái" },
            { status: 500 }
        );
    }
}
