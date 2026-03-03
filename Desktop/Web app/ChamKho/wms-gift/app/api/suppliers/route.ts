import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            include: {
                _count: { select: { purchaseOrders: true } },
            },
            orderBy: { supplierCode: "asc" },
        });

        return NextResponse.json({ suppliers });
    } catch (error) {
        console.error("GET /api/suppliers error:", error);
        return NextResponse.json({ error: "Failed to fetch suppliers" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const supplier = await prisma.supplier.create({
            data: {
                supplierCode: body.supplierCode,
                supplierName: body.supplierName,
                country: body.country,
                contactPerson: body.contactPerson || null,
                phone: body.phone || null,
                email: body.email || null,
                paymentTerms: body.paymentTerms || null,
                currency: body.currency || "VND",
                leadTimeDays: body.leadTimeDays || 0,
                rating: body.rating || 3,
                notes: body.notes || null,
            },
        });
        return NextResponse.json(supplier, { status: 201 });
    } catch (error: unknown) {
        console.error("POST /api/suppliers error:", error);
        const msg =
            error instanceof Error && "code" in error && (error as { code: string }).code === "P2002"
                ? "Mã supplier đã tồn tại"
                : "Không thể tạo supplier";
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}
