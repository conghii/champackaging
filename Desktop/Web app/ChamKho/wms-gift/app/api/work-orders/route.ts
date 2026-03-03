import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "";
        const priority = searchParams.get("priority") || "";
        const search = searchParams.get("search") || ""; // WO number or Product name/SKU

        const where: any = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (search) {
            where.OR = [
                { woNumber: { contains: search, mode: "insensitive" } },
                { product: { productName: { contains: search, mode: "insensitive" } } },
                { product: { skuCode: { contains: search, mode: "insensitive" } } },
            ];
        }

        // List WOs
        const orders = await prisma.workOrder.findMany({
            where,
            include: {
                product: { select: { productName: true, skuCode: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // KPI KPI Calculations
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const inProgressCount = await prisma.workOrder.count({
            where: { status: "IN_PROGRESS" },
        });

        const completedThisMonthCount = await prisma.workOrder.count({
            where: {
                status: "COMPLETED",
                updatedAt: { gte: firstDayOfMonth },
            },
        });

        const overdueCount = await prisma.workOrder.count({
            where: {
                status: { not: "COMPLETED" },
                plannedEndDate: { lt: now },
            },
        });

        const completedThisMonthItems = await prisma.workOrder.aggregate({
            where: {
                status: "COMPLETED",
                updatedAt: { gte: firstDayOfMonth },
            },
            _sum: { quantityCompleted: true },
        });
        const unitsThisMonth = completedThisMonthItems._sum.quantityCompleted || 0;

        return NextResponse.json({
            orders,
            kpis: {
                inProgress: inProgressCount,
                completedMonth: completedThisMonthCount,
                overdue: overdueCount,
                unitsMonth: unitsThisMonth,
            },
        });
    } catch (error) {
        console.error("GET /api/work-orders error:", error);
        return NextResponse.json({ error: "Failed to fetch WOs" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate stock
        const bomEntries = await prisma.billOfMaterial.findMany({
            where: { productId: body.productId },
            include: { material: true },
        });

        if (bomEntries.length === 0) {
            return NextResponse.json(
                { error: "Sản phẩm chưa có BOM, không thể sản xuất" },
                { status: 400 }
            );
        }

        const qtyPlanned = Number(body.quantityPlanned);
        const insufficient: string[] = [];

        for (const bom of bomEntries) {
            const required = Number(bom.quantityPerUnit) * qtyPlanned * (1 + Number(bom.wastagePercent) / 100);
            if (Number(bom.material.currentStock) < required) {
                insufficient.push(
                    `${bom.material.materialName} (cần ${Math.ceil(required)}, còn ${bom.material.currentStock})`
                );
            }
        }

        if (insufficient.length > 0) {
            return NextResponse.json(
                { error: "Thiếu nguyên liệu:\n" + insufficient.join("\n") },
                { status: 400 }
            );
        }

        // Generate WO number
        const count = await prisma.workOrder.count();
        const year = new Date().getFullYear();
        const woNumber = `WO-${year}-${String(count + 1).padStart(3, "0")}`;

        const wo = await prisma.workOrder.create({
            data: {
                woNumber,
                productId: body.productId,
                quantityPlanned: qtyPlanned,
                priority: body.priority || "NORMAL",
                status: "DRAFT",
                plannedStartDate: body.plannedStartDate ? new Date(body.plannedStartDate) : new Date(),
                plannedEndDate: body.plannedEndDate ? new Date(body.plannedEndDate) : new Date(Date.now() + 86400000),
                notes: body.notes || null,
            },
        });

        return NextResponse.json(wo, { status: 201 });
    } catch (error) {
        console.error("POST /api/work-orders error:", error);
        return NextResponse.json({ error: "Không thể tạo WO" }, { status: 500 });
    }
}
