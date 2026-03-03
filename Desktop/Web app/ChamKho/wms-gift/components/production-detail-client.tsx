"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Plus, X } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WORK_ORDER_STATUS, type WorkOrderStatusKey } from "@/lib/constants";

/* ================================================================
   TYPES
   ================================================================ */

interface MaterialUsage {
    materialId: string;
    materialCode: string;
    materialName: string;
    unit: string;
    plannedQty: number;
    actualQty: number; // For now mocked as plannedQty based on API
}

interface Shift {
    id: string;
    employee: { fullName: string; role: string };
    date: string;
    shiftType: string;
    hoursWorked: number;
    unitsProduced: number;
    notes: string | null;
}

interface WorkOrder {
    id: string;
    woNumber: string;
    productId: string;
    product: { skuCode: string; productName: string };
    quantityPlanned: number;
    quantityCompleted: number;
    quantityRejected: number;
    priority: string;
    status: string;
    plannedStartDate: string;
    plannedEndDate: string;
    actualStartDate: string | null;
    actualEndDate: string | null;
    notes: string | null;
    shifts: Shift[];
}

/* ================================================================
   TIMELINE STEPS & ACTIONS
   ================================================================ */

const TIMELINE_STEPS = ["DRAFT", "PENDING", "IN_PROGRESS", "QC_CHECK", "PACKAGING", "COMPLETED"];
const TIMELINE_LABELS: Record<string, string> = {
    DRAFT: "Bản nháp",
    PENDING: "Chờ xuất NL",
    IN_PROGRESS: "Đang SX",
    QC_CHECK: "Kiểm tra QC",
    PACKAGING: "Đóng gói",
    COMPLETED: "Hoàn thành",
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    NORMAL: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function ProductionDetailClient() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();

    const [wo, setWo] = useState<WorkOrder | null>(null);
    const [materials, setMaterials] = useState<MaterialUsage[]>([]);

    const [loading, setLoading] = useState(true);
    const [transitioning, setTransitioning] = useState(false);
    const [activeTab, setActiveTab] = useState(0);

    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [showShiftModal, setShowShiftModal] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            const [r1, r2] = await Promise.all([
                fetch(`/api/work-orders/${id}`),
                fetch(`/api/work-orders/${id}/materials`),
            ]);
            const d1 = await r1.json();
            const d2 = await r2.json();
            setWo(d1.wo);
            setMaterials(d2.materials || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAction = async (targetStatus: string) => {
        if (!wo) return;

        // In Progress material deduction warning
        if (wo.status === "PENDING" && targetStatus === "IN_PROGRESS") {
            const msgs = materials.map(m => `- ${m.plannedQty} ${m.unit} ${m.materialName}`);
            const ok = window.confirm(`Hành động này sẽ TỰ ĐỘNG XUẤT KHO các nguyên liệu sau:\n\n${msgs.join("\n")}\n\nBạn có chắc chắn muốn bắt đầu sản xuất?`);
            if (!ok) return;
        }

        setTransitioning(true);
        try {
            const res = await fetch(`/api/work-orders/${id}/transition`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetStatus }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            await fetchData();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setTransitioning(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;
    if (!wo) return <div className="text-center py-20 text-gray-400">WO không tồn tại</div>;

    const st = WORK_ORDER_STATUS[wo.status as WorkOrderStatusKey];
    const currentStepIdx = TIMELINE_STEPS.indexOf(wo.status === "PAUSED" ? "IN_PROGRESS" : wo.status);

    const pctFinished = wo.quantityPlanned > 0 ? (wo.quantityCompleted / wo.quantityPlanned) * 100 : 0;

    return (
        <div className="space-y-6">
            <button onClick={() => router.push("/production")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft size={16} /> Quay lại
            </button>

            {/* HEADER SECTION - 2 cols */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Info */}
                <div className="lg:col-span-8 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                                {wo.woNumber}
                                <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${PRIORITY_COLORS[wo.priority]}`}>{wo.priority}</span>
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Sản phẩm: <span className="font-medium text-gray-800">{wo.product.productName}</span> ({wo.product.skuCode})
                            </p>
                        </div>

                        {/* ACTION BUTTONS (State Machine) */}
                        <div className="flex flex-wrap gap-2 justify-end">
                            {wo.status === "DRAFT" && (
                                <Btn icon="✅" label="Xác nhận lệnh" onClick={() => handleAction("PENDING")} loading={transitioning} color="bg-blue-600 hover:bg-blue-700" />
                            )}
                            {wo.status === "PENDING" && (
                                <Btn icon="▶️" label="Bắt đầu sản xuất" onClick={() => handleAction("IN_PROGRESS")} loading={transitioning} color="bg-indigo-600 hover:bg-indigo-700" />
                            )}
                            {wo.status === "IN_PROGRESS" && (
                                <>
                                    <Btn icon="⏸️" label="Tạm dừng" onClick={() => handleAction("PAUSED")} loading={transitioning} color="bg-orange-500 hover:bg-orange-600" />
                                    <Btn icon="🔍" label="Gửi QC" onClick={() => handleAction("QC_CHECK")} loading={transitioning} color="bg-purple-600 hover:bg-purple-700" />
                                </>
                            )}
                            {wo.status === "PAUSED" && (
                                <Btn icon="▶️" label="Tiếp tục" onClick={() => handleAction("IN_PROGRESS")} loading={transitioning} color="bg-indigo-600 hover:bg-indigo-700" />
                            )}
                            {wo.status === "QC_CHECK" && (
                                <>
                                    <Btn icon="❌" label="QC Fail (Làm lại)" onClick={() => handleAction("IN_PROGRESS")} loading={transitioning} color="bg-red-500 hover:bg-red-600 border border-red-600" />
                                    <Btn icon="✅" label="QC Pass (Đóng gói)" onClick={() => handleAction("PACKAGING")} loading={transitioning} color="bg-emerald-600 hover:bg-emerald-700" />
                                </>
                            )}
                            {wo.status === "PACKAGING" && (
                                <Btn icon="🎉" label="Hoàn thành WO" onClick={() => setShowCompleteModal(true)} loading={transitioning} color="bg-emerald-600 hover:bg-emerald-700" />
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm pt-2">
                        <div>
                            <p className="text-gray-500 mb-1">Thời gian kế hoạch</p>
                            <p className="font-medium text-gray-800">{formatDate(wo.plannedStartDate)} — {formatDate(wo.plannedEndDate)}</p>
                        </div>
                        <div>
                            <p className="text-gray-500 mb-1">Thời gian thực tế</p>
                            <p className="font-medium text-gray-800">
                                {wo.actualStartDate ? formatDate(wo.actualStartDate) : "Chưa bắt đầu"} — {wo.actualEndDate ? formatDate(wo.actualEndDate) : "Chưa hoàn thành"}
                            </p>
                        </div>
                        {wo.notes && (
                            <div className="col-span-2">
                                <p className="text-gray-500 mb-1">Ghi chú</p>
                                <p className="text-gray-800 bg-gray-50 p-2 rounded-md">{wo.notes}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Timeline & Status */}
                <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-center">
                    <div className="flex flex-col items-center">
                        <span className={`px-4 py-1.5 text-sm font-bold rounded-full mb-6 ${st?.color || "bg-gray-100"}`}>
                            {st?.label || wo.status}
                        </span>

                        {/* Vertical Timeline */}
                        <div className="w-full pl-8 space-y-6 relative">
                            <div className="absolute left-[39px] top-2 bottom-4 w-0.5 bg-gray-100 -z-10" />
                            {TIMELINE_STEPS.map((step, idx) => {
                                const isPast = idx < currentStepIdx;
                                const isCurrent = idx === currentStepIdx;

                                return (
                                    <div key={step} className="flex items-center gap-4 relative">
                                        <div className={`w-5 h-5 rounded-full z-10 border-2 ${isCurrent ? 'bg-blue-600 border-blue-600' : isPast ? 'bg-blue-200 border-blue-200' : 'bg-white border-gray-200'}`} />
                                        <span className={`text-sm font-medium ${isCurrent ? 'text-blue-700 font-bold' : isPast ? 'text-gray-600' : 'text-gray-400'}`}>
                                            {TIMELINE_LABELS[step]}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* PROGRESS SECTION */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Tiến độ sản xuất</h3>
                <div className="grid grid-cols-3 gap-6 mb-6 text-center divide-x">
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Kế hoạch (Units)</p>
                        <p className="text-3xl font-bold text-[#1E3A5F]">{wo.quantityPlanned.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Hoàn thành (Pass)</p>
                        <p className="text-3xl font-bold text-emerald-600">{wo.quantityCompleted.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-1">Từ chối (Reject)</p>
                        <p className="text-3xl font-bold text-red-500">{wo.quantityRejected.toLocaleString()}</p>
                    </div>
                </div>

                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(pctFinished, 100)}%` }} />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
                    <span>0%</span>
                    <span>{Math.round(pctFinished)}%</span>
                </div>
            </div>

            {/* BOTTOM TABS */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    {["Nguyên liệu sử dụng", "Ca làm việc (Shifts)"].map((lbl, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            className={`flex-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === idx ? "border-[#1E3A5F] text-[#1E3A5F]" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                        >
                            {lbl}
                        </button>
                    ))}
                </div>

                <div className="p-0">
                    {activeTab === 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold">Tên nguyên liệu</th>
                                        <th className="px-6 py-3 font-semibold text-right">Kế hoạch (BOM × Qty)</th>
                                        <th className="px-6 py-3 font-semibold text-right">Thực tế đã dùng</th>
                                        <th className="px-6 py-3 font-semibold text-right">Chênh lệch</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {materials.map(m => {
                                        const diff = m.actualQty - m.plannedQty;
                                        const isOver = diff > 0;

                                        return (
                                            <tr key={m.materialId} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4">
                                                    <span className="font-mono text-xs text-gray-400 mr-2">{m.materialCode}</span>
                                                    <span className="font-medium text-gray-800">{m.materialName}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums text-gray-600">{m.plannedQty.toLocaleString()} {m.unit}</td>
                                                <td className="px-6 py-4 text-right tabular-nums font-medium text-gray-800">{m.actualQty.toLocaleString()} {m.unit}</td>
                                                <td className={`px-6 py-4 text-right tabular-nums font-bold ${isOver ? 'text-red-500' : 'text-green-600'}`}>
                                                    {isOver ? "+" : ""}{diff.toLocaleString()} {m.unit}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {materials.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400">Không có dữ liệu BOM</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {activeTab === 1 && (
                        <div>
                            <div className="flex justify-end p-4 border-b border-gray-100">
                                <button onClick={() => setShowShiftModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                                    <Plus size={16} /> Thêm ca làm
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">Ngày</th>
                                            <th className="px-6 py-3 font-semibold">Ca làm</th>
                                            <th className="px-6 py-3 font-semibold">Nhân sự</th>
                                            <th className="px-6 py-3 font-semibold text-right">Giờ làm</th>
                                            <th className="px-6 py-3 font-semibold text-right">Đạt (Units)</th>
                                            <th className="px-6 py-3 font-semibold">Ghi chú</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {wo.shifts.map(sh => (
                                            <tr key={sh.id} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 font-medium text-gray-800">{formatDate(sh.date)}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                                        <Clock size={12} /> {sh.shiftType === "Sáng" ? "Morning" : sh.shiftType === "Chiều" ? "Afternoon" : "Night"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-medium text-gray-800">{sh.employee.fullName}</div>
                                                    <div className="text-xs text-gray-500">{sh.employee.role}</div>
                                                </td>
                                                <td className="px-6 py-4 text-right tabular-nums text-gray-600">{sh.hoursWorked}h</td>
                                                <td className="px-6 py-4 text-right tabular-nums font-bold text-emerald-600">+{sh.unitsProduced}</td>
                                                <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{sh.notes || "—"}</td>
                                            </tr>
                                        ))}
                                        {wo.shifts.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">Chưa ghi nhận ca làm việc nào</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showCompleteModal && <CompleteModal wo={wo} onClose={() => setShowCompleteModal(false)} onCompleted={fetchData} />}
            {showShiftModal && <ShiftModal woId={wo.id} onClose={() => setShowShiftModal(false)} onAdded={fetchData} />}
        </div>
    );
}

/* ================================================================
   HELPERS & SUB-COMPONENTS
   ================================================================ */

function Btn({ icon, label, onClick, color, loading }: any) {
    return (
        <button onClick={onClick} disabled={loading} className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 ${color}`}>
            {loading ? "⌛" : icon} {label}
        </button>
    );
}

// -- COMPLETE MODAL --
function CompleteModal({ wo, onClose, onCompleted }: any) {
    const [qty, setQty] = useState(wo.quantityPlanned.toString());
    const [rej, setRej] = useState("0");
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/work-orders/${wo.id}/complete`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quantityCompleted: Number(qty), quantityRejected: Number(rej) }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            alert("PO đã hoàn thành! FBA Inbound Inventory đã được cập nhật.");
            onCompleted();
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="font-bold text-gray-800">Hoàn thành Work Order</h2>
                    <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg flex items-start gap-2">
                        <span className="text-lg leading-none">ℹ️</span>
                        <p>Bạn sắp hoàn thành lệnh SX số <b>{wo.woNumber}</b>. Số lượng Pass sẽ tự động được cộng vào <b>Inbound FBA Inventory</b>.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Pass (Đạt) *</label>
                            <input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} required className="w-full border-2 border-emerald-100 focus:border-emerald-500 rounded-lg p-2 text-lg font-bold text-emerald-700 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Reject (Lỗi)</label>
                            <input type="number" min="0" value={rej} onChange={(e) => setRej(e.target.value)} required className="w-full border-2 border-red-100 focus:border-red-500 rounded-lg p-2 text-lg font-bold text-red-500 outline-none" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Hủy</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg">
                            {saving ? "Đang xử lý..." : "Xác nhận & Cập nhật kho"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// -- SHIFT MODAL --
function ShiftModal({ woId, onClose, onAdded }: any) {
    const [emps, setEmps] = useState<any[]>([]);
    const [form, setForm] = useState({ employeeId: "", date: new Date().toISOString().split("T")[0], shiftType: "Sáng", hoursWorked: "8", unitsProduced: "0", notes: "" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/employees").then(r => r.json()).then(d => setEmps(d.employees || [])).catch();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.employeeId) return alert("Chọn nhân viên!");
        setSaving(true);
        try {
            const res = await fetch(`/api/work-orders/${woId}/shifts`, {
                method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
            });
            if (!res.ok) throw new Error();
            onAdded();
            onClose();
        } catch {
            alert("Lỗi");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="font-bold text-gray-800">Ghi nhận ca làm việc</h2>
                    <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Nhân viên *</label>
                        <select required value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 text-sm">
                            <option value="">— Chọn —</option>
                            {emps.map(em => <option key={em.id} value={em.id}>{em.fullName} ({em.role})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Ngày *</label>
                            <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Ca làm *</label>
                            <select required value={form.shiftType} onChange={e => setForm({ ...form, shiftType: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 text-sm">
                                <option value="Sáng">Sáng</option><option value="Chiều">Chiều</option><option value="Tối">Tối</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">Giờ làm *</label>
                            <input type="number" step="0.5" min="0.5" required value={form.hoursWorked} onChange={e => setForm({ ...form, hoursWorked: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1 block">SP Hoàn thành</label>
                            <input type="number" min="0" value={form.unitsProduced} onChange={e => setForm({ ...form, unitsProduced: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 text-sm text-emerald-600 font-bold" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1 block">Ghi chú</label>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full border border-gray-200 rounded-lg p-2 text-sm" rows={2} />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">Hủy</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1E3A5F] text-white font-medium rounded-lg text-sm">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
