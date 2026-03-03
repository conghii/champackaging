import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const category_id = url.searchParams.get("category_id");

        const where: any = {};
        if (category_id) {
            where.category_id = category_id;
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                fbaInventory: true,
                category: true,
                billOfMaterials: {
                    include: { material: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const activeCount = await prisma.product.count({ where: { status: "ACTIVE" } });

        return NextResponse.json({ products, activeCount });
    } catch (error) {
        console.error("GET /api/products error:", error);
        return NextResponse.json(
            { error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { bom, ...productData } = body;

        const product = await prisma.product.create({
            data: {
                skuCode: productData.skuCode,
                productName: productData.productName,
                category_id: productData.category_id || null,
                design_name: productData.design_name || null,
                thumbnail_emoji: productData.thumbnail_emoji || "🎁",
                amazonAsin: productData.amazonAsin || null,
                amazonFnsku: productData.amazonFnsku || null,
                sellingPrice: productData.sellingPrice || 0,
                minStockFba: productData.minStockFba || 0,
                leadTimeDays: productData.leadTimeDays || 0,
                status: "ACTIVE",
            },
        });

        if (bom && Array.isArray(bom) && bom.length > 0) {
            await prisma.billOfMaterial.createMany({
                data: bom.map(
                    (item: any) => ({
                        productId: product.id,
                        materialId: item.materialId,
                        quantityPerUnit: item.quantityPerUnit,
                        wastagePercent: item.wastagePercent || 0,
                        is_from_template: item.is_from_template || false,
                        override_template: item.override_template || false,
                        notes: item.notes || null,
                    })
                ),
            });
        }

        await prisma.fBAInventory.create({
            data: {
                productId: product.id,
                fulfillableQty: 0,
                inboundQty: 0,
                reservedQty: 0,
            },
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error: unknown) {
        console.error("POST /api/products error:", error);
        return NextResponse.json({ error: "Không thể tạo sản phẩm" }, { status: 400 });
    }
}
