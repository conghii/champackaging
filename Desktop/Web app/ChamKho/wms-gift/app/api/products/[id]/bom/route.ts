import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: productId } = await params;
        const body = await req.json();
        const { items } = body;

        if (!Array.isArray(items)) {
            return NextResponse.json(
                { error: "Invalid BOM data" },
                { status: 400 }
            );
        }

        // Delete existing BOM entries for this product
        await prisma.billOfMaterial.deleteMany({
            where: { productId },
        });

        // Create new BOM entries
        if (items.length > 0) {
            await prisma.billOfMaterial.createMany({
                data: items.map(
                    (item: {
                        materialId: string;
                        quantityPerUnit: number;
                        wastagePercent?: number;
                        notes?: string;
                    }) => ({
                        productId,
                        materialId: item.materialId,
                        quantityPerUnit: item.quantityPerUnit,
                        wastagePercent: item.wastagePercent || 0,
                        notes: item.notes || null,
                    })
                ),
            });
        }

        // Return updated BOM
        const updatedBom = await prisma.billOfMaterial.findMany({
            where: { productId },
            include: { material: true },
            orderBy: { material: { materialCode: "asc" } },
        });

        return NextResponse.json({ bom: updatedBom });
    } catch (error) {
        console.error("PUT /api/products/[id]/bom error:", error);
        return NextResponse.json(
            { error: "Không thể cập nhật BOM" },
            { status: 400 }
        );
    }
}
