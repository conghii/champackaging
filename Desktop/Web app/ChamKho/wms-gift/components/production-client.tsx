"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Plus,
    X,
    Eye,
    Search,
    ChevronRight,
    ChevronLeft,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WORK_ORDER_STATUS, type WorkOrderStatusKey } from "@/lib/constants";

/* ================================================================
   TYPES
   ================================================================ */

interface Product {
    id: string;
    skuCode: string;
    productName: string;
}

interface WorkOrder {
    id: string;
    woNumber: string;
    productId: string;
    product: Product;
    quantityPlanned: number;
    quantityCompleted: number;
    priority: string;
    status: string;
    plannedStartDate: string;
    plannedEndDate: string;
}

interface Material {
    id: string;
    materialCode: string;
    materialName: string;
    unit: string;
    currentStock: number;
}

interface BOMData {
    material: Material;
    quantityPerUnit: number;
    wastagePercent: number;
}

/* ================================================================
   PRIORITY BADGES
   ================================================================ */

const PRIORITY_COLORS: Record<string, string> = {
    LOW: "bg-gray-100 text-gray-600",
    NORMAL: "bg-blue-100 text-blue-700",
    HIGH: "bg-orange-100 text-orange-700",
    URGENT: "bg-red-100 text-red-700",
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function ProductionClient() {
    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const [kpis, setKpis] = useState({
        inProgress: 0,
        completedMonth: 0,
        overdue: 0,
        unitsMonth: 0,
    });
    const [loading, setLoading] = useState(true);

    // Filters
    const [filterStatus, setFilterStatus] = useState("");
    const [filterPriority, setFilterPriority] = useState("");
    const [search, setSearch] = useState("");

    const [showCreate, setShowCreate] = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams();
            if (filterStatus) p.set("status", filterStatus);
            if (filterPriority) p.set("priority", filterPriority);
            if (search) p.set("search", search);

            const res = await fetch(`/api/work-orders?${p}`);
            const data = await res.json();
            setOrders(data.orders || []);
            if (data.kpis) setKpis(data.kpis);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterPriority, search]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Sản xuất (Work Orders)</h1>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="🏭 Đang sản xuất" value={kpis.inProgress} subtitle="Work Orders" />
                <KPICard title="✅ Hoàn thành tháng này" value={kpis.completedMonth} subtitle="Work Orders" />
                <KPICard title="⚠️ Trễ hạn" value={kpis.overdue} subtitle="Chưa hoàn thành" isAlert={kpis.overdue > 0} />
                <KPICard title="📦 Units SX tháng này" value={kpis.unitsMonth.toLocaleString("vi-VN")} subtitle="Sản phẩm" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-3 flex-1">
                    <div className="relative w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo Mã WO, SKU..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">Tất cả Status</option>
                        {Object.entries(WORK_ORDER_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>
                                {v.label}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filterPriority}
                        onChange={(e) => setFilterPriority(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">Tất cả Ưu tiên</option>
                        <option value="LOW">LOW</option>
                        <option value="NORMAL">NORMAL</option>
                        <option value="HIGH">HIGH</option>
                        <option value="URGENT">URGENT</option>
                    </select>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4f7f] transition-colors shrink-0"
                >
                    <Plus size={16} />
                    Tạo lệnh SX
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {[
                                    "WO Số",
                                    "Sản phẩm",
                                    "Kế hoạch",
                                    "Hoàn thành",
                                    "Tiến độ",
                                    "Priority",
                                    "Status",
                                    "Ngày kết thúc",
                                    "Action",
                                ].map((col) => (
                                    <th key={col} className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">Đang tải...</td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">Chưa có Work Order nào</td>
                                </tr>
                            ) : (
                                orders.map((wo) => {
                                    const s = WORK_ORDER_STATUS[wo.status as WorkOrderStatusKey];
                                    const pColor = PRIORITY_COLORS[wo.priority] || "bg-gray-100";

                                    const isLate = new Date(wo.plannedEndDate) < new Date() && wo.status !== "COMPLETED";
                                    const pct = wo.quantityPlanned > 0 ? (wo.quantityCompleted / wo.quantityPlanned) * 100 : 0;

                                    return (
                                        <tr key={wo.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                                            <td className="px-4 py-3 font-mono font-medium text-gray-800">{wo.woNumber}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-800">{wo.product.productName}</div>
                                                <div className="text-xs text-gray-500 font-mono">{wo.product.skuCode}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right tabular-nums">{wo.quantityPlanned.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right tabular-nums text-green-600 font-semibold">{wo.quantityCompleted.toLocaleString()}</td>
                                            <td className="px-4 py-3 min-w-[120px]">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-600">{Math.round(pct)}%</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold leading-none ${pColor}`}>
                                                    {wo.priority}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium leading-none ${s?.color}`}>
                                                    {s?.label || wo.status}
                                                </span>
                                            </td>
                                            <td className={`px-4 py-3 font-medium ${isLate ? "text-red-500" : "text-gray-600"}`}>
                                                {formatDate(wo.plannedEndDate)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link href={`/production/${wo.id}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                    <Eye size={16} /> Xem
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showCreate && (
                <CreateWOModal onClose={() => setShowCreate(false)} onCreated={fetchOrders} />
            )}
        </div>
    );
}

/* ================================================================
   KPI CARD
   ================================================================ */

function KPICard({ title, value, subtitle, isAlert = false }: { title: string; value: string | number; subtitle: string; isAlert?: boolean }) {
    return (
        <div className={`bg-white rounded-xl border p-5 ${isAlert ? "border-red-200" : "border-gray-200"}`}>
            <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
            <p className={`text-2xl font-bold ${isAlert ? "text-red-600" : "text-gray-800"}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        </div>
    );
}

/* ================================================================
   CREATE MODAL
   ================================================================ */

function CreateWOModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
    const [products, setProducts] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        productId: "",
        quantityPlanned: "",
        priority: "NORMAL",
        plannedStartDate: new Date().toISOString().split("T")[0],
        plannedEndDate: new Date(Date.now() + 86400000 * 7).toISOString().split("T")[0],
        notes: "",
    });

    const [bomData, setBomData] = useState<BOMData[]>([]);

    useEffect(() => {
        fetch("/api/products?limit=100")
            .then(r => r.json())
            .then(d => setProducts(d.products || []))
            .catch();
    }, []);

    // Fetch BOM when product selected
    useEffect(() => {
        if (!form.productId) {
            setBomData([]);
            return;
        }
        fetch(`/api/products/${form.productId}`)
            .then(r => r.json())
            .then(d => {
                if (d.product?.billOfMaterials) {
                    setBomData(d.product.billOfMaterials);
                }
            })
            .catch();
    }, [form.productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.productId || !form.quantityPlanned) {
            setError("Vui lòng chọn Sản phẩm và nhập số lượng");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/work-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onCreated();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    const qty = Number(form.quantityPlanned) || 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">Tạo lệnh sản xuất (WO)</h2>
                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 whitespace-pre-wrap">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-600 mb-1">Sản phẩm (SKU) *</label>
                            <select
                                value={form.productId}
                                onChange={(e) => setForm({ ...form, productId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="">— Chọn SKU —</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.skuCode} — {p.productName}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">SL Kế hoạch *</label>
                            <input type="number" min="1" value={form.quantityPlanned} onChange={(e) => setForm({ ...form, quantityPlanned: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Mức độ ưu tiên</label>
                            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                <option value="LOW">LOW (Thấp)</option>
                                <option value="NORMAL">NORMAL (Bình thường)</option>
                                <option value="HIGH">HIGH (Cao)</option>
                                <option value="URGENT">URGENT (Khẩn cấp)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Dự kiến bắt đầu</label>
                            <input type="date" value={form.plannedStartDate} onChange={(e) => setForm({ ...form, plannedStartDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Dự kiến kết thúc</label>
                            <input type="date" value={form.plannedEndDate} onChange={(e) => setForm({ ...form, plannedEndDate: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Ghi chú</label>
                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div>

                    {/* BOM Stock Preview */}
                    {form.productId && qty > 0 && (
                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Dự kiến Nguyên liệu cần xuất (BOM)</h4>
                            <div className="space-y-2">
                                {bomData.length === 0 ? (
                                    <p className="text-xs text-gray-400">Sản phẩm chưa có BOM</p>
                                ) : (
                                    bomData.map((bom) => {
                                        const req = Math.ceil(Number(bom.quantityPerUnit) * qty * (1 + Number(bom.wastagePercent) / 100));
                                        const isShort = req > Number(bom.material.currentStock);
                                        return (
                                            <div key={bom.material.id} className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">{bom.material.materialName}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="tabular-nums font-medium text-gray-800">Cần: {req} {bom.material.unit}</span>
                                                    <span className={`tabular-nums w-24 text-right ${isShort ? 'text-red-500 font-bold' : 'text-gray-400'}`}>Kho: {bom.material.currentStock}</span>
                                                    {isShort && <span className="text-xs text-red-500">⚠️ Thiếu {req - Number(bom.material.currentStock)}</span>}
                                                </div>
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Hủy</button>
                        <button type="submit" disabled={saving || qty <= 0} className="px-5 py-2 text-sm font-medium text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f] disabled:opacity-50">
                            {saving ? "Đang tạo..." : "✅ Xác nhận tạo WO"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
