import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const supplier = await prisma.supplier.update({
            where: { id },
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
        return NextResponse.json(supplier);
    } catch (error) {
        console.error("PUT /api/suppliers/[id] error:", error);
        return NextResponse.json({ error: "Không thể cập nhật supplier" }, { status: 400 });
    }
}
