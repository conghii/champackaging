import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                billOfMaterials: {
                    include: { material: true },
                    orderBy: { material: { materialCode: "asc" } },
                },
                fbaInventory: true,
                workOrders: {
                    orderBy: { createdAt: "desc" },
                    take: 5,
                },
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        // Fetch sales data (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const salesData = await prisma.salesData.findMany({
            where: {
                productId: id,
                saleDate: { gte: thirtyDaysAgo },
            },
            orderBy: { saleDate: "asc" },
        });

        return NextResponse.json({ product, salesData });
    } catch (error) {
        console.error("GET /api/products/[id] error:", error);
        return NextResponse.json(
            { error: "Failed to fetch product" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const product = await prisma.product.update({
            where: { id },
            data: {
                productName: body.productName,
                category: body.category || null,
                amazonAsin: body.amazonAsin || null,
                amazonFnsku: body.amazonFnsku || null,
                sellingPrice: body.sellingPrice,
                minStockFba: body.minStockFba,
                leadTimeDays: body.leadTimeDays,
                status: body.status,
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("PUT /api/products/[id] error:", error);
        return NextResponse.json(
            { error: "Không thể cập nhật sản phẩm" },
            { status: 400 }
        );
    }
}
