import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const material = await prisma.material.update({
            where: { id },
            data: {
                materialCode: body.materialCode,
                materialName: body.materialName,
                category: body.category || null,
                unit: body.unit,
                currentStock: body.currentStock,
                minStock: body.minStock,
                reorderQty: body.reorderQty,
                avgUnitCost: body.avgUnitCost,
                storageLocation: body.storageLocation || null,
            },
        });

        return NextResponse.json(material);
    } catch (error) {
        console.error("PUT /api/materials/[id] error:", error);
        return NextResponse.json(
            { error: "Không thể cập nhật nguyên liệu" },
            { status: 400 }
        );
    }
}
