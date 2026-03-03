import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // Format: YYYY-MM
        const employeeId = searchParams.get("employeeId");

        let whereClause: any = {};

        if (month) {
            const [y, m] = month.split("-").map(Number);
            const start = new Date(y, m - 1, 1);
            const end = new Date(y, m, 1);
            whereClause.workDate = { gte: start, lt: end };
        }

        if (employeeId && employeeId !== "all") {
            whereClause.employeeId = employeeId;
        }

        const records = await prisma.attendance.findMany({
            where: whereClause,
            include: { employee: true },
            orderBy: { workDate: "desc" },
        });

        return NextResponse.json({ attendance: records });
    } catch (error) {
        console.error("GET /api/attendance error:", error);
        return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        // Validate employee exists
        const emp = await prisma.employee.findUnique({ where: { id: body.employeeId } });
        if (!emp) return NextResponse.json({ error: "Nhân viên không tồn tại" }, { status: 400 });

        const attendance = await prisma.attendance.create({
            data: {
                employeeId: body.employeeId,
                workDate: new Date(body.workDate),
                shift: body.shift,
                hoursWorked: body.hoursWorked,
                unitsCompleted: body.unitsCompleted || 0,
                workOrderId: body.workOrderId || null,
                notes: body.notes
            },
            include: { employee: true }
        });

        return NextResponse.json({ attendance });
    } catch (error) {
        console.error("POST /api/attendance error:", error);
        return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
    }
}
