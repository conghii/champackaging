import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const employees = await prisma.employee.findMany({
            orderBy: { createdAt: "desc" },
        });

        const summary = {
            totalActive: employees.filter(e => e.status === "ACTIVE").length,
            production: employees.filter(e => e.status === "ACTIVE" && e.role === "production").length,
            warehouse: employees.filter(e => e.status === "ACTIVE" && e.role === "warehouse").length,
        };

        return NextResponse.json({ employees, summary });
    } catch (error) {
        console.error("GET /api/employees error:", error);
        return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Check code unique
        const existing = await prisma.employee.findUnique({
            where: { employeeCode: body.employeeCode }
        });
        if (existing) {
            return NextResponse.json({ error: "Mã nhân viên đã tồn tại" }, { status: 400 });
        }

        const emp = await prisma.employee.create({
            data: {
                employeeCode: body.employeeCode,
                fullName: body.fullName,
                role: body.role,
                department: body.department,
                wageType: body.wageType,
                baseSalary: body.baseSalary,
                phone: body.phone,
                joinDate: new Date(body.joinDate),
                status: body.status || "ACTIVE",
                notes: body.notes
            }
        });

        return NextResponse.json({ employee: emp });
    } catch (error) {
        console.error("POST /api/employees error:", error);
        return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
    }
}
