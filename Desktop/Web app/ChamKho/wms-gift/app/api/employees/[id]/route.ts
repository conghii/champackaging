import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const body = await req.json();
        const { id } = await params;

        // Check code unique if changing
        if (body.employeeCode) {
            const existing = await prisma.employee.findUnique({
                where: { employeeCode: body.employeeCode }
            });
            if (existing && existing.id !== id) {
                return NextResponse.json({ error: "Mã nhân viên đã tồn tại ở người khác" }, { status: 400 });
            }
        }

        const emp = await prisma.employee.update({
            where: { id },
            data: {
                employeeCode: body.employeeCode,
                fullName: body.fullName,
                role: body.role,
                department: body.department,
                wageType: body.wageType,
                baseSalary: body.baseSalary !== undefined ? body.baseSalary : undefined,
                phone: body.phone,
                joinDate: body.joinDate ? new Date(body.joinDate) : undefined,
                status: body.status,
                notes: body.notes
            }
        });

        return NextResponse.json({ employee: emp });
    } catch (error) {
        console.error("PUT /api/employees/[id] error:", error);
        return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
    }
}
