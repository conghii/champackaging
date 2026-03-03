import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const filter = searchParams.get("filter") || "all";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Record<string, unknown> = {};

        if (search) {
            where.OR = [
                { materialCode: { contains: search, mode: "insensitive" } },
                { materialName: { contains: search, mode: "insensitive" } },
            ];
        }

        // Get all materials first for filtering by stock level
        const allMaterials = await prisma.material.findMany({
            where: where as never,
            orderBy: { materialCode: "asc" },
        });

        // Apply stock filter
        let filtered = allMaterials;
        if (filter === "low") {
            filtered = allMaterials.filter(
                (m) =>
                    Number(m.currentStock) > Number(m.minStock) &&
                    Number(m.currentStock) < Number(m.minStock) * 1.5
            );
        } else if (filter === "out") {
            filtered = allMaterials.filter(
                (m) => Number(m.currentStock) <= Number(m.minStock)
            );
        }

        const total = filtered.length;
        const paginated = filtered.slice(skip, skip + limit);

        // Summary stats
        const totalMaterials = allMaterials.length;
        const totalValue = allMaterials.reduce(
            (sum, m) => sum + Number(m.currentStock) * Number(m.avgUnitCost),
            0
        );
        const lowStockCount = allMaterials.filter(
            (m) => Number(m.currentStock) < Number(m.minStock) * 1.5
        ).length;
        const outOfStockCount = allMaterials.filter(
            (m) => Number(m.currentStock) <= Number(m.minStock)
        ).length;

        return NextResponse.json({
            materials: paginated,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            summary: {
                totalMaterials,
                totalValue,
                lowStockCount,
                outOfStockCount,
            },
        });
    } catch (error) {
        console.error("GET /api/materials error:", error);
        return NextResponse.json(
            { error: "Failed to fetch materials" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const material = await prisma.material.create({
            data: {
                materialCode: body.materialCode,
                materialName: body.materialName,
                category: body.category || null,
                unit: body.unit,
                currentStock: body.currentStock || 0,
                minStock: body.minStock || 0,
                reorderQty: body.reorderQty || 0,
                avgUnitCost: body.avgUnitCost || 0,
                storageLocation: body.storageLocation || null,
            },
        });

        return NextResponse.json(material, { status: 201 });
    } catch (error: unknown) {
        console.error("POST /api/materials error:", error);
        const msg =
            error instanceof Error &&
                "code" in error &&
                (error as { code: string }).code === "P2002"
                ? "Mã nguyên liệu đã tồn tại"
                : "Không thể tạo nguyên liệu";
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
