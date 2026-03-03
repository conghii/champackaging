import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month"); // Format: YYYY-MM

        if (!month) return new NextResponse("Thiếu tham số 'month'", { status: 400 });

        const [y, m] = month.split("-").map(Number);
        const startObj = new Date(y, m - 1, 1);
        const endObj = new Date(y, m, 1);

        const employees = await prisma.employee.findMany();
        const attendances = await prisma.attendance.findMany({
            where: { workDate: { gte: startObj, lt: endObj } }
        });

        let csvContent = "\uFEFFMã NV,Họ tên,Bộ phận,Loại lương,Ngày công,Tổng giờ,Tổng SP,Lương (VND)\n";
        let grandTotal = 0;

        employees.forEach(emp => {
            const empAtts = attendances.filter(a => a.employeeId === emp.id);
            if (emp.status === "INACTIVE" && empAtts.length === 0) return;

            let totalDays = 0, totalHours = 0, totalUnits = 0, calculatedSalary = 0;
            const base = Number(emp.baseSalary);

            empAtts.forEach(a => {
                totalDays += 1;
                totalHours += Number(a.hoursWorked);
                totalUnits += a.unitsCompleted;
            });

            if (emp.wageType === "monthly") calculatedSalary = (base / 26) * totalDays;
            if (emp.wageType === "hourly") calculatedSalary = totalHours * (base / 160);
            if (emp.wageType === "per_unit") calculatedSalary = totalUnits * base;

            grandTotal += calculatedSalary;

            const wageTypeStr = emp.wageType === "monthly" ? "Tháng" : emp.wageType === "hourly" ? "Giờ" : "Sản phẩm";

            // Escape commas in names/departments
            const safeName = `"${emp.fullName.replace(/"/g, '""')}"`;
            const safeDept = `"${(emp.department || "—").replace(/"/g, '""')}"`;

            csvContent += `${emp.employeeCode},${safeName},${safeDept},${wageTypeStr},${totalDays},${totalHours},${totalUnits},${Math.round(calculatedSalary)}\n`;
        });

        csvContent += `,,,,,,,TỔNG CỘNG: ${Math.round(grandTotal)}\n`;

        return new NextResponse(csvContent, {
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="bang-luong-${month}.csv"`,
            }
        });
    } catch (error) {
        console.error("GET /api/payroll/export error:", error);
        return new NextResponse("Failed to export payroll", { status: 500 });
    }
}
