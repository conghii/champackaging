import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const category = await prisma.productCategory.findUnique({
            where: { id },
            include: {
                bom_templates: {
                    include: {
                        material: true,
                    }
                }
            }
        });

        if (!category) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }

        return NextResponse.json(category.bom_templates);
    } catch (error) {
        console.error("GET /api/categories/[id]/template error:", error);
        return NextResponse.json(
            { error: "Thao tác lấy template không thành công." },
            { status: 400 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await req.json();

        // 1. Clear old templates
        await prisma.bOMTemplate.deleteMany({
            where: { category_id: id }
        });

        // 2. Create new templates
        if (body.templates && Array.isArray(body.templates)) {
            await prisma.bOMTemplate.createMany({
                data: body.templates.map((t: any) => ({
                    category_id: id,
                    material_id: t.material_id,
                    quantity_per_unit: t.quantity_per_unit,
                    wastage_percent: t.wastage_percent
                }))
            });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("PUT /api/categories/[id]/template error:", error);
        return NextResponse.json(
            { error: "Thao tác tạo template không thành công." },
            { status: 400 }
        );
    }
}
