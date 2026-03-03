"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Users, Factory, Package,
    Search, Plus, Edit, Calendar, Download, FileText
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";

// --- Types ---
type WageType = "monthly" | "hourly" | "per_unit";
type EmployeeStatus = "ACTIVE" | "INACTIVE";

interface Employee {
    id: string;
    employeeCode: string;
    fullName: string;
    role: string;
    department: string | null;
    wageType: WageType;
    baseSalary: string;
    phone: string | null;
    joinDate: string;
    status: EmployeeStatus;
    notes: string | null;
}

interface Attendance {
    id: string;
    employeeId: string;
    workDate: string;
    shift: string;
    hoursWorked: string;
    unitsCompleted: number;
    workOrderId: string | null;
    notes: string | null;
    employee: Employee;
}

interface PayrollDetail {
    employeeId: string;
    employeeCode: string;
    fullName: string;
    department: string;
    wageType: WageType;
    baseSalary: number;
    totalDays: number;
    totalHours: number;
    totalUnits: number;
    calculatedSalary: number;
}

// --- Component ---
export default function HRClient() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"employees" | "attendance">("employees");
    const [searchTerm, setSearchTerm] = useState("");

    // Payroll/Attendance state
    const currentDate = new Date();
    const defaultMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
    const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("all");

    // --- Queries ---
    const { data: empData, isLoading: empLoading } = useQuery({
        queryKey: ["employees"],
        queryFn: () => fetch("/api/employees").then(res => res.json())
    });

    const { data: attendanceData, isLoading: attLoading } = useQuery({
        queryKey: ["attendance", selectedMonth, selectedEmployeeId],
        queryFn: () => fetch(`/api/attendance?month=${selectedMonth}&employeeId=${selectedEmployeeId}`).then(res => res.json())
    });

    const { data: payrollData, isLoading: payrollLoading } = useQuery({
        queryKey: ["payroll", selectedMonth],
        queryFn: () => fetch(`/api/payroll?month=${selectedMonth}`).then(res => res.json())
    });

    // --- Mocks for Modals ---
    // In a real implementation we'd abstract these to separate components.
    const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
    const [isAttModalOpen, setIsAttModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // --- Rendering Helpers ---
    const wageTyleLabels: Record<WageType, { label: string, color: string }> = {
        monthly: { label: "Tháng", color: "bg-blue-100 text-blue-700" },
        hourly: { label: "Giờ", color: "bg-orange-100 text-orange-700" },
        per_unit: { label: "Sản phẩm", color: "bg-purple-100 text-purple-700" },
    };

    const handleExportCSV = () => {
        window.location.href = `/api/payroll/export?month=${selectedMonth}`;
    };

    const employees: Employee[] = empData?.employees || [];
    const filteredEmployees = employees.filter(e =>
        e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Nhân sự & Chấm công</h1>
                    <p className="text-gray-500 mt-1">Danh sách nhân viên, theo dõi ca làm và tính lương tự động</p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex space-x-1 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("employees")}
                    className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "employees" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                >
                    Nhân viên
                </button>
                <button
                    onClick={() => setActiveTab("attendance")}
                    className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "attendance" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                >
                    Chấm công & Lương
                </button>
            </div>

            {/* =========================================================
          TAB 1: EMPLOYEES
          ========================================================= */}
            {activeTab === "employees" && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Tổng nhân viên Active</p>
                                {empLoading ? <Skeleton className="h-8 w-16 mt-2" /> : <h3 className="text-3xl font-bold text-gray-900 mt-1">{empData?.summary?.totalActive || 0}</h3>}
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><Users size={24} /></div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Bộ phận Sản xuất</p>
                                {empLoading ? <Skeleton className="h-8 w-16 mt-2" /> : <h3 className="text-3xl font-bold text-gray-900 mt-1">{empData?.summary?.production || 0}</h3>}
                            </div>
                            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Factory size={24} /></div>
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500">Bộ phận Kho</p>
                                {empLoading ? <Skeleton className="h-8 w-16 mt-2" /> : <h3 className="text-3xl font-bold text-gray-900 mt-1">{empData?.summary?.warehouse || 0}</h3>}
                            </div>
                            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Package size={24} /></div>
                        </div>
                    </div>

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Tìm theo mã hoặc tên nhân viên..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            />
                        </div>
                        <button
                            onClick={() => setIsEmpModalOpen(true)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                        >
                            <Plus size={18} />
                            <span>Thêm nhân viên</span>
                        </button>
                    </div>

                    {/* Table */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Mã NV</th>
                                        <th className="px-6 py-3 font-medium">Họ tên</th>
                                        <th className="px-6 py-3 font-medium">Bộ phận / Vai trò</th>
                                        <th className="px-6 py-3 font-medium">Loại lương</th>
                                        <th className="px-6 py-3 font-medium text-right">Lương cơ bản</th>
                                        <th className="px-6 py-3 font-medium">Ngày vào làm</th>
                                        <th className="px-6 py-3 font-medium">Trạng thái</th>
                                        <th className="px-6 py-3 font-medium text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {empLoading ? (
                                        <tr><td colSpan={8} className="p-6"><Skeleton className="w-full h-20" /></td></tr>
                                    ) : filteredEmployees.length > 0 ? (
                                        filteredEmployees.map(emp => (
                                            <tr key={emp.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-mono text-gray-600">{emp.employeeCode}</td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{emp.fullName}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-800">{emp.department || "—"}</span>
                                                        <span className="text-xs text-gray-500">{emp.role}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${wageTyleLabels[emp.wageType].color}`}>
                                                        {wageTyleLabels[emp.wageType].label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-gray-900">
                                                    {formatCurrency(Number(emp.baseSalary))}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {formatDate(emp.joinDate)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${emp.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                                                        {emp.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors" title="Sửa thông tin">
                                                            <Edit size={16} />
                                                        </button>
                                                        <button className="text-gray-400 hover:text-indigo-600 p-1 rounded transition-colors" title="Xem chấm công" onClick={() => { setActiveTab("attendance"); setSelectedEmployeeId(emp.id); }}>
                                                            <Calendar size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Chưa có nhân viên nào. Nhấn Thêm nhân viên.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================================================
          TAB 2: ATTENDANCE & PAYROLL
          ========================================================= */}
            {activeTab === "attendance" && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={e => setSelectedMonth(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <select
                                value={selectedEmployeeId}
                                onChange={e => setSelectedEmployeeId(e.target.value)}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="all">Tất cả nhân viên</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.employeeCode} - {e.fullName}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                            <button
                                onClick={() => setIsAttModalOpen(true)}
                                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <Plus size={18} />
                                <span>Nhập chấm công</span>
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <Download size={18} />
                                <span>Xuất bảng lương</span>
                            </button>
                        </div>
                    </div>

                    {/* TOTAL ROW */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex justify-between items-center">
                        <span className="font-bold text-emerald-800">Tổng lương phải trả tháng {selectedMonth}:</span>
                        {payrollLoading ? <Skeleton className="w-32 h-6 bg-emerald-200" /> : (
                            <span className="text-xl font-bold text-emerald-700">{formatCurrency(payrollData?.totalMonthlyPayroll || 0)}</span>
                        )}
                    </div>

                    {/* PAYROLL TABLE */}
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Nhân viên</th>
                                        <th className="px-6 py-3 font-medium">Loại lương</th>
                                        <th className="px-6 py-3 font-medium text-center">Ngày công</th>
                                        <th className="px-6 py-3 font-medium text-center">Tổng giờ</th>
                                        <th className="px-6 py-3 font-medium text-center">Tổng SP</th>
                                        <th className="px-6 py-3 font-medium text-right">Lương tính (VND)</th>
                                        <th className="px-6 py-3 font-medium text-center">Chi tiết</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {payrollLoading ? (
                                        <tr><td colSpan={7} className="p-6"><Skeleton className="w-full h-32" /></td></tr>
                                    ) : payrollData?.details?.length > 0 ? (
                                        // If filtering by one employee, filter the payroll data here
                                        payrollData.details
                                            .filter((d: PayrollDetail) => selectedEmployeeId === "all" ? true : d.employeeId === selectedEmployeeId)
                                            .map((detail: PayrollDetail) => (
                                                <tr key={detail.employeeId} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-gray-900">{detail.fullName}</span>
                                                            <span className="text-xs text-gray-500">{detail.employeeCode} &bull; {detail.department}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${wageTyleLabels[detail.wageType].color}`}>
                                                            {wageTyleLabels[detail.wageType].label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-gray-700">{detail.totalDays}</td>
                                                    <td className="px-6 py-4 text-center font-medium text-gray-700">{detail.totalHours.toFixed(1)}h</td>
                                                    <td className="px-6 py-4 text-center font-medium text-gray-700">{detail.totalUnits}</td>
                                                    <td className="px-6 py-4 text-right font-bold text-emerald-600 text-base">{formatCurrency(detail.calculatedSalary)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button onClick={() => setIsDetailModalOpen(true)} className="text-blue-600 hover:text-blue-800 hover:underline">Xem</button>
                                                    </td>
                                                </tr>
                                            ))
                                    ) : (
                                        <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">Không có dữ liệu chấm công cho tháng này.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PLACEHOLDERS */}
            {isEmpModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Thêm / Sửa Nhân Viên</h2>
                            <button onClick={() => setIsEmpModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
                        </div>
                        <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Mã NV *</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="NV001" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Họ tên *</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Vai trò *</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                                        <option value="production">Sản xuất</option>
                                        <option value="warehouse">Kho</option>
                                        <option value="admin">Văn phòng</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Bộ phận</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Loại lương *</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                                        <option value="monthly">Tháng</option>
                                        <option value="hourly">Giờ</option>
                                        <option value="per_unit">Theo sản phẩm</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Lương cơ bản / Đơn giá *</label>
                                    <div className="relative">
                                        <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-12" placeholder="VD: 5000000" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">VND</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Số điện thoại</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Ngày vào làm *</label>
                                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" rows={2}></textarea>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button onClick={() => setIsEmpModalOpen(false)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
                            <button className="px-4 py-2 font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors">Lưu nhân viên</button>
                        </div>
                    </div>
                </div>
            )}

            {isAttModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold">Nhập chấm công mới</h2>
                            <button onClick={() => setIsAttModalOpen(false)} className="text-gray-400 hover:text-gray-900">✕</button>
                        </div>
                        <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Nhân viên *</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                                    <option value="">-- Chọn nhân viên --</option>
                                    {employees.filter(e => e.status === "ACTIVE").map(e => (
                                        <option key={e.id} value={e.id}>{e.employeeCode} - {e.fullName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Ngày làm *</label>
                                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" defaultValue={new Date().toISOString().split('T')[0]} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Ca làm *</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                                        <option value="morning">Sáng (8h-12h)</option>
                                        <option value="afternoon">Chiều (13h-17h)</option>
                                        <option value="evening">Tối (18h-22h)</option>
                                        <option value="full_day">Cả ngày (8h-17h)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700">Giờ làm thực tế *</label>
                                    <div className="relative">
                                        <input type="number" step="0.5" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-10" placeholder="4" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">giờ</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-700 leading-tight">Số SP hoàn thành<br /><span className="text-xs text-gray-400 font-normal">(Chỉ dùng nếu lương theo SP)</span></label>
                                    <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="0" />
                                </div>
                            </div>

                            <div className="space-y-1 border-t border-gray-100 pt-4">
                                <label className="text-sm font-medium text-gray-700">Lệnh SX liên quan (Tuỳ chọn)</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                                    <option value="">-- Không có --</option>
                                    {/* Dropdown would fetch from API based on IN_PROGRESS WOs */}
                                    <option value="mock-wo-id">WO-2026-001 (500 units)</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm font-medium text-gray-700">Ghi chú</label>
                                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" rows={2}></textarea>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                            <button onClick={() => setIsAttModalOpen(false)} className="px-4 py-2 font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Hủy</button>
                            <button className="px-4 py-2 font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">Lưu chấm công</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
