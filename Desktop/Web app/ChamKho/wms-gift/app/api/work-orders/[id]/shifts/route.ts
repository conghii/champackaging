import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const shift = await prisma.productionShift.create({
            data: {
                workOrderId: id,
                employeeId: body.employeeId,
                date: new Date(body.date),
                shiftType: body.shiftType,
                hoursWorked: Number(body.hoursWorked) || 0,
                unitsProduced: Number(body.unitsProduced) || 0,
                notes: body.notes || null,
            },
        });

        return NextResponse.json(shift, { status: 201 });
    } catch (error) {
        console.error("POST /api/work-orders/[id]/shifts error:", error);
        return NextResponse.json({ error: "Không thể thêm ca làm" }, { status: 500 });
    }
}
