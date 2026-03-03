"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Boxes,
    DollarSign,
    AlertTriangle,
    XCircle,
    Search,
    Plus,
    ChevronLeft,
    ChevronRight,
    Pencil,
    PackagePlus,
    X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { STOCK_ALERT } from "@/lib/constants";

// ============================================================
// Types
// ============================================================

interface Material {
    id: string;
    materialCode: string;
    materialName: string;
    category: string | null;
    unit: string;
    currentStock: string | number;
    minStock: string | number;
    reorderQty: string | number;
    avgUnitCost: string | number;
    storageLocation: string | null;
    createdAt: string;
}

interface Summary {
    totalMaterials: number;
    totalValue: number;
    lowStockCount: number;
    outOfStockCount: number;
}

interface ApiResponse {
    materials: Material[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: Summary;
}

// ============================================================
// Stock Level Helper
// ============================================================

function getStockLevel(
    current: number,
    min: number
): "normal" | "warning" | "critical" {
    if (current <= min) return "critical";
    if (current < min * 1.5) return "warning";
    return "normal";
}

// ============================================================
// Main Component
// ============================================================

export default function MaterialsClient() {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [summary, setSummary] = useState<Summary>({
        totalMaterials: 0,
        totalValue: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
    });
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(true);

    // Modal states
    const [editModal, setEditModal] = useState<{
        open: boolean;
        material: Material | null;
    }>({ open: false, material: null });
    const [adjustModal, setAdjustModal] = useState<{
        open: boolean;
        material: Material | null;
    }>({ open: false, material: null });

    // Fetch materials
    const fetchMaterials = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: "20",
                search,
                filter,
            });
            const res = await fetch(`/api/materials?${params}`);
            const data: ApiResponse = await res.json();
            setMaterials(data.materials);
            setSummary(data.summary);
            setTotal(data.total);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Fetch materials failed:", error);
        } finally {
            setLoading(false);
        }
    }, [page, search, filter]);

    useEffect(() => {
        fetchMaterials();
    }, [fetchMaterials]);

    // Debounced search
    const [searchInput, setSearchInput] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearch(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    return (
        <div className="space-y-6">
            {/* ============ SUMMARY CARDS ============ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                    icon={<Boxes size={24} />}
                    value={summary.totalMaterials}
                    label="Tổng loại nguyên liệu"
                    iconColor="text-blue-600"
                    iconBg="bg-blue-50"
                />
                <SummaryCard
                    icon={<DollarSign size={24} />}
                    value={formatCurrency(summary.totalValue, "VND")}
                    label="Tổng giá trị kho"
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-50"
                />
                <SummaryCard
                    icon={<AlertTriangle size={24} />}
                    value={summary.lowStockCount}
                    label="Sắp hết hàng"
                    iconColor="text-yellow-600"
                    iconBg="bg-yellow-50"
                    alert={summary.lowStockCount > 0 ? "yellow" : undefined}
                />
                <SummaryCard
                    icon={<XCircle size={24} />}
                    value={summary.outOfStockCount}
                    label="Hết hàng"
                    iconColor="text-red-600"
                    iconBg="bg-red-50"
                    alert={summary.outOfStockCount > 0 ? "red" : undefined}
                />
            </div>

            {/* ============ TOOLBAR ============ */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                            type="text"
                            placeholder="Tìm theo mã hoặc tên..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>
                    <select
                        value={filter}
                        onChange={(e) => {
                            setFilter(e.target.value);
                            setPage(1);
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                        <option value="all">Tất cả</option>
                        <option value="low">⚠️ Sắp hết hàng</option>
                        <option value="out">🔴 Hết hàng</option>
                    </select>
                </div>
                <button
                    onClick={() => setEditModal({ open: true, material: null })}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4f7f] transition-colors shrink-0"
                >
                    <Plus size={16} />
                    Thêm nguyên liệu
                </button>
            </div>

            {/* ============ TABLE ============ */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                                    Mã
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                                    Tên nguyên liệu
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                                    Đơn vị
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                    Tồn kho
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                    Tồn tối thiểu
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                    Giá TB
                                </th>
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                                    Vị trí
                                </th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600">
                                    Trạng thái
                                </th>
                                <th className="text-center px-4 py-3 font-semibold text-gray-600">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : materials.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        Không tìm thấy nguyên liệu nào
                                    </td>
                                </tr>
                            ) : (
                                materials.map((m) => {
                                    const current = Number(m.currentStock);
                                    const min = Number(m.minStock);
                                    const level = getStockLevel(current, min);
                                    const alert = STOCK_ALERT[level];

                                    return (
                                        <tr
                                            key={m.id}
                                            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                                {m.materialCode}
                                            </td>
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {m.materialName}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{m.unit}</td>
                                            <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                                {Number(current).toLocaleString("vi-VN")}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500 tabular-nums">
                                                {Number(min).toLocaleString("vi-VN")}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-500 tabular-nums">
                                                {formatCurrency(Number(m.avgUnitCost), "VND")}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {m.storageLocation || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${alert.color}`}
                                                >
                                                    {alert.icon} {alert.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        onClick={() =>
                                                            setEditModal({ open: true, material: m })
                                                        }
                                                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            setAdjustModal({ open: true, material: m })
                                                        }
                                                        className="p-1.5 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                                        title="Điều chỉnh tồn kho"
                                                    >
                                                        <PackagePlus size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
                        <span>
                            Trang {page}/{totalPages} — {total} nguyên liệu
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page >= totalPages}
                                className="p-1.5 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ============ EDIT MODAL ============ */}
            {editModal.open && (
                <MaterialEditModal
                    material={editModal.material}
                    onClose={() => setEditModal({ open: false, material: null })}
                    onSaved={fetchMaterials}
                />
            )}

            {/* ============ ADJUST MODAL ============ */}
            {adjustModal.open && adjustModal.material && (
                <StockAdjustModal
                    material={adjustModal.material}
                    onClose={() => setAdjustModal({ open: false, material: null })}
                    onSaved={fetchMaterials}
                />
            )}
        </div>
    );
}

// ============================================================
// Summary Card
// ============================================================

function SummaryCard({
    icon,
    value,
    label,
    iconColor,
    iconBg,
    alert,
}: {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    iconColor: string;
    iconBg: string;
    alert?: "yellow" | "red";
}) {
    const borderClass =
        alert === "red"
            ? "border-red-300 bg-red-50/30"
            : alert === "yellow"
                ? "border-yellow-300 bg-yellow-50/30"
                : "border-gray-200 bg-white";

    return (
        <div
            className={`rounded-xl border p-5 flex items-center gap-4 ${borderClass}`}
        >
            <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconBg} ${iconColor}`}
            >
                {icon}
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
}

// ============================================================
// Material Edit Modal
// ============================================================

function MaterialEditModal({
    material,
    onClose,
    onSaved,
}: {
    material: Material | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const isEdit = !!material;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        materialCode: material?.materialCode || "",
        materialName: material?.materialName || "",
        category: material?.category || "",
        unit: material?.unit || "pcs",
        currentStock: String(Number(material?.currentStock || 0)),
        minStock: String(Number(material?.minStock || 0)),
        reorderQty: String(Number(material?.reorderQty || 0)),
        avgUnitCost: String(Number(material?.avgUnitCost || 0)),
        storageLocation: material?.storageLocation || "",
    });

    const updateField = (key: string, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.materialCode.trim() || !form.materialName.trim() || !form.unit.trim()) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc (*)");
            return;
        }

        setSaving(true);
        try {
            const payload = {
                ...form,
                currentStock: parseFloat(form.currentStock) || 0,
                minStock: parseFloat(form.minStock) || 0,
                reorderQty: parseFloat(form.reorderQty) || 0,
                avgUnitCost: parseFloat(form.avgUnitCost) || 0,
            };

            const url = isEdit ? `/api/materials/${material.id}` : "/api/materials";
            const method = isEdit ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Lỗi không xác định");
            }

            onSaved();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">
                        {isEdit ? "Chỉnh sửa nguyên liệu" : "Thêm nguyên liệu mới"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <FieldInput
                            label="Mã NL *"
                            value={form.materialCode}
                            onChange={(v) => updateField("materialCode", v)}
                            placeholder="MAT-014"
                            disabled={isEdit}
                        />
                        <FieldInput
                            label="Đơn vị *"
                            value={form.unit}
                            onChange={(v) => updateField("unit", v)}
                            placeholder="pcs, set, m..."
                        />
                    </div>

                    <FieldInput
                        label="Tên nguyên liệu *"
                        value={form.materialName}
                        onChange={(v) => updateField("materialName", v)}
                        placeholder="Tên nguyên liệu"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                                Danh mục
                            </label>
                            <select
                                value={form.category}
                                onChange={(e) => updateField("category", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                                <option value="">— Chọn danh mục —</option>
                                <option value="Positive Jar">Positive Jar</option>
                                <option value="Ornament">Ornament</option>
                                <option value="Dùng chung">Dùng chung</option>
                                <option value="raw_material">Nguyên liệu thô</option>
                                <option value="packaging">Bao bì</option>
                                <option value="label">Nhãn mác</option>
                                <option value="accessory">Phụ kiện</option>
                            </select>
                        </div>
                        <FieldInput
                            label="Vị trí kho"
                            value={form.storageLocation}
                            onChange={(v) => updateField("storageLocation", v)}
                            placeholder="Kệ A1"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <FieldInput
                            label="Tồn hiện tại"
                            value={form.currentStock}
                            onChange={(v) => updateField("currentStock", v)}
                            type="number"
                        />
                        <FieldInput
                            label="Tồn tối thiểu"
                            value={form.minStock}
                            onChange={(v) => updateField("minStock", v)}
                            type="number"
                        />
                        <FieldInput
                            label="Số lượng đặt lại"
                            value={form.reorderQty}
                            onChange={(v) => updateField("reorderQty", v)}
                            type="number"
                        />
                    </div>

                    <FieldInput
                        label="Giá đơn vị (VND)"
                        value={form.avgUnitCost}
                        onChange={(v) => updateField("avgUnitCost", v)}
                        type="number"
                    />

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f] transition-colors disabled:opacity-50"
                        >
                            {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================================
// Stock Adjust Modal
// ============================================================

function StockAdjustModal({
    material,
    onClose,
    onSaved,
}: {
    material: Material;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [type, setType] = useState<"add" | "remove" | "count">("add");
    const [quantity, setQuantity] = useState("");
    const [reason, setReason] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const currentStock = Number(material.currentStock);

    const previewStock =
        type === "add"
            ? currentStock + (parseFloat(quantity) || 0)
            : type === "remove"
                ? Math.max(0, currentStock - (parseFloat(quantity) || 0))
                : parseFloat(quantity) || 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason.trim()) {
            setError("Vui lòng nhập lý do điều chỉnh");
            return;
        }
        if (!quantity || parseFloat(quantity) <= 0) {
            setError("Số lượng phải lớn hơn 0");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/materials/${material.id}/adjust`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type,
                    quantity: parseFloat(quantity),
                    reason,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Lỗi không xác định");
            }

            onSaved();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-800">
                        Điều chỉnh tồn kho
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Material info */}
                    <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-medium text-gray-800">
                            {material.materialName}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {material.materialCode} · Tồn hiện tại:{" "}
                            <span className="font-bold text-gray-700">
                                {currentStock.toLocaleString("vi-VN")} {material.unit}
                            </span>
                        </p>
                    </div>

                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    {/* Adjustment type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            Loại điều chỉnh
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: "add" as const, label: "➕ Nhập thêm" },
                                { value: "remove" as const, label: "➖ Xuất kho" },
                                { value: "count" as const, label: "📋 Kiểm kê" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => {
                                        setType(opt.value);
                                        setError("");
                                    }}
                                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${type === opt.value
                                            ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            {type === "count" ? "Số lượng thực tế" : "Số lượng"}
                        </label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                                setQuantity(e.target.value);
                                setError("");
                            }}
                            min="0"
                            step="any"
                            placeholder="0"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Preview */}
                    {quantity && parseFloat(quantity) > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3 text-sm">
                            <span className="text-gray-600">Tồn kho sau điều chỉnh: </span>
                            <span className="font-bold text-blue-700">
                                {previewStock.toLocaleString("vi-VN")} {material.unit}
                            </span>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                            Lý do *
                        </label>
                        <input
                            type="text"
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError("");
                            }}
                            placeholder="VD: Nhập hàng từ NCC Minh Châu"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f] transition-colors disabled:opacity-50"
                        >
                            {saving ? "Đang lưu..." : "Xác nhận"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ============================================================
// Shared Field Input
// ============================================================

function FieldInput({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    disabled = false,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
        </div>
    );
}
