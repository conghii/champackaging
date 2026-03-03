import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { type, quantity, reason } = body;

        if (!reason || !reason.trim()) {
            return NextResponse.json(
                { error: "Lý do điều chỉnh là bắt buộc" },
                { status: 400 }
            );
        }

        if (!quantity || quantity <= 0) {
            return NextResponse.json(
                { error: "Số lượng phải lớn hơn 0" },
                { status: 400 }
            );
        }

        const material = await prisma.material.findUnique({ where: { id } });
        if (!material) {
            return NextResponse.json(
                { error: "Nguyên liệu không tồn tại" },
                { status: 404 }
            );
        }

        let newStock: number;
        const currentStock = Number(material.currentStock);

        switch (type) {
            case "add":
                newStock = currentStock + quantity;
                break;
            case "remove":
                newStock = Math.max(0, currentStock - quantity);
                break;
            case "count":
                newStock = quantity;
                break;
            default:
                return NextResponse.json(
                    { error: "Loại điều chỉnh không hợp lệ" },
                    { status: 400 }
                );
        }

        const updated = await prisma.material.update({
            where: { id },
            data: { currentStock: newStock },
        });

        return NextResponse.json({
            material: updated,
            adjustment: {
                type,
                quantity,
                reason,
                previousStock: currentStock,
                newStock,
            },
        });
    } catch (error) {
        console.error("POST /api/materials/[id]/adjust error:", error);
        return NextResponse.json(
            { error: "Không thể điều chỉnh tồn kho" },
            { status: 500 }
        );
    }
}
