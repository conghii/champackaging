import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();

        const updatedCategory = await prisma.productCategory.update({
            where: { id },
            data: {
                code: body.code,
                name: body.name,
                description: body.description,
                color: body.color,
                icon: body.icon,
                sort_order: body.sort_order,
            },
        });

        return NextResponse.json(updatedCategory);
    } catch (error: any) {
        console.error("PUT /api/categories/[id] error:", error);
        return NextResponse.json(
            { error: "Thao tác cập nhật không thành công." },
            { status: 400 }
        );
    }
}
