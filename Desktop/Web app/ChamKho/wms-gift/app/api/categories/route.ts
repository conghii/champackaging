import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const categories = await prisma.productCategory.findMany({
            include: {
                _count: {
                    select: { products: true }
                }
            },
            orderBy: { sort_order: "asc" },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("GET /api/categories error:", error);
        return NextResponse.json(
            { error: "Failed to fetch categories" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const category = await prisma.productCategory.create({
            data: {
                code: body.code,
                name: body.name,
                description: body.description || null,
                color: body.color || null,
                icon: body.icon || null,
                sort_order: body.sort_order || 0,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/categories error:", error);
        return NextResponse.json({ error: "Cannot create category" }, { status: 400 });
    }
}
