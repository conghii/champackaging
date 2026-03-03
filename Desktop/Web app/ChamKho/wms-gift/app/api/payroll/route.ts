import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // Format: YYYY-MM

        if (!month) return NextResponse.json({ error: "Thiếu tham số 'month' (YYYY-MM)" }, { status: 400 });

        const [y, m] = month.split("-").map(Number);
        const startObj = new Date(y, m - 1, 1);
        const endObj = new Date(y, m, 1);

        // Fetch all active employees or anyone who has attendance
        const employees = await prisma.employee.findMany();
        const attendances = await prisma.attendance.findMany({
            where: { workDate: { gte: startObj, lt: endObj } }
        });

        const payroll: any[] = [];
        let totalMonthlyPayroll = 0;

        for (const emp of employees) {
            const empAtts = attendances.filter(a => a.employeeId === emp.id);

            // Skip inactive employees with zero attendance this month
            if (emp.status === "INACTIVE" && empAtts.length === 0) continue;

            let totalDays = 0;
            let totalHours = 0;
            let totalUnits = 0;
            let calculatedSalary = 0;
            const base = Number(emp.baseSalary);

            empAtts.forEach(a => {
                totalDays += 1;
                totalHours += Number(a.hoursWorked);
                totalUnits += a.unitsCompleted;
            });

            switch (emp.wageType) {
                case "monthly":
                    // Formula: base_salary / 26 * days_worked
                    calculatedSalary = (base / 26) * totalDays;
                    break;
                case "hourly":
                    // Formula: total_hours * (base_salary / 160)
                    calculatedSalary = totalHours * (base / 160);
                    break;
                case "per_unit":
                    // Formula: total_units * base_salary (as rate per unit)
                    calculatedSalary = totalUnits * base;
                    break;
            }

            totalMonthlyPayroll += calculatedSalary;

            payroll.push({
                employeeId: emp.id,
                employeeCode: emp.employeeCode,
                fullName: emp.fullName,
                department: emp.department || "—",
                wageType: emp.wageType,
                baseSalary: base,
                totalDays,
                totalHours,
                totalUnits,
                calculatedSalary
            });
        }

        return NextResponse.json({
            month,
            totalMonthlyPayroll,
            details: payroll.sort((a, b) => b.calculatedSalary - a.calculatedSalary)
        });
    } catch (error) {
        console.error("GET /api/payroll error:", error);
        return NextResponse.json({ error: "Failed to calculate payroll" }, { status: 500 });
    }
}
