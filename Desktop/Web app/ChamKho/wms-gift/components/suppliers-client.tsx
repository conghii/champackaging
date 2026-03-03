"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Plus,
    X,
    Pencil,
    Eye,
    Search,
    Trash2,
    ChevronRight,
    ChevronLeft,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
    PO_STATUS,
    PAYMENT_STATUS,
    type POStatusKey,
    type PaymentStatusKey,
} from "@/lib/constants";

/* ================================================================
   TYPES
   ================================================================ */

interface Supplier {
    id: string;
    supplierCode: string;
    supplierName: string;
    country: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    paymentTerms: string | null;
    currency: string;
    leadTimeDays: number;
    rating: number;
    notes: string | null;
    _count: { purchaseOrders: number };
}

interface PO {
    id: string;
    poNumber: string;
    supplierId: string;
    supplier: { supplierName: string; supplierCode: string };
    status: string;
    paymentStatus: string;
    totalAmount: string | number;
    currency: string;
    expectedDelivery: string | null;
    createdAt: string;
    _count: { items: number };
}

interface MaterialOption {
    id: string;
    materialCode: string;
    materialName: string;
    unit: string;
    avgUnitCost: string | number;
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function SuppliersClient() {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800">
                    Nhập hàng & Supplier
                </h1>
            </div>

            {/* Tab headers */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                {["Nhà cung cấp", "Đơn nhập hàng (PO)"].map((label, idx) => (
                    <button
                        key={idx}
                        onClick={() => setActiveTab(idx)}
                        className={`px-5 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === idx
                                ? "bg-white text-gray-800 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {activeTab === 0 && <SupplierTab />}
            {activeTab === 1 && <POTab />}
        </div>
    );
}

/* ================================================================
   SUPPLIER TAB
   ================================================================ */

function SupplierTab() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState<{
        open: boolean;
        supplier: Supplier | null;
    }>({ open: false, supplier: null });

    const fetch_ = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/suppliers");
            const data = await res.json();
            setSuppliers(data.suppliers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetch_();
    }, [fetch_]);

    return (
        <>
            {/* Toolbar */}
            <div className="flex justify-end">
                <button
                    onClick={() => setEditModal({ open: true, supplier: null })}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4f7f] transition-colors"
                >
                    <Plus size={16} />
                    Thêm Supplier
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {[
                                    "Mã",
                                    "Tên",
                                    "Quốc gia",
                                    "Liên hệ",
                                    "Thanh toán",
                                    "Lead time",
                                    "Rating",
                                    "Số PO",
                                    "Hành động",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : suppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="text-center py-12 text-gray-400">
                                        Chưa có supplier nào
                                    </td>
                                </tr>
                            ) : (
                                suppliers.map((s) => (
                                    <tr
                                        key={s.id}
                                        className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                            {s.supplierCode}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-800">
                                            {s.supplierName}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{s.country}</td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {s.contactPerson || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {s.paymentTerms || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">
                                            {s.leadTimeDays} ngày
                                        </td>
                                        <td className="px-4 py-3">
                                            {"⭐".repeat(Math.min(s.rating, 5))}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                                                {s._count.purchaseOrders}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        setEditModal({ open: true, supplier: s })
                                                    }
                                                    className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                                                    title="Sửa"
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editModal.open && (
                <SupplierEditModal
                    supplier={editModal.supplier}
                    onClose={() => setEditModal({ open: false, supplier: null })}
                    onSaved={fetch_}
                />
            )}
        </>
    );
}

/* ================================================================
   SUPPLIER EDIT MODAL
   ================================================================ */

function SupplierEditModal({
    supplier,
    onClose,
    onSaved,
}: {
    supplier: Supplier | null;
    onClose: () => void;
    onSaved: () => void;
}) {
    const isEdit = !!supplier;
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [form, setForm] = useState({
        supplierCode: supplier?.supplierCode || "",
        supplierName: supplier?.supplierName || "",
        country: supplier?.country || "Việt Nam",
        contactPerson: supplier?.contactPerson || "",
        phone: supplier?.phone || "",
        email: supplier?.email || "",
        paymentTerms: supplier?.paymentTerms || "",
        currency: supplier?.currency || "VND",
        leadTimeDays: String(supplier?.leadTimeDays || 7),
        rating: String(supplier?.rating || 3),
        notes: supplier?.notes || "",
    });

    const upd = (k: string, v: string) => {
        setForm((p) => ({ ...p, [k]: v }));
        setError("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            !form.supplierCode.trim() ||
            !form.supplierName.trim() ||
            !form.country.trim()
        ) {
            setError("Vui lòng điền Mã, Tên và Quốc gia");
            return;
        }
        setSaving(true);
        try {
            const url = isEdit
                ? `/api/suppliers/${supplier.id}`
                : "/api/suppliers";
            const method = isEdit ? "PUT" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    leadTimeDays: parseInt(form.leadTimeDays) || 0,
                    rating: parseInt(form.rating) || 3,
                }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
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
                        {isEdit ? "Chỉnh sửa Supplier" : "Thêm Supplier mới"}
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
                        <Inp label="Mã *" v={form.supplierCode} onChange={(v) => upd("supplierCode", v)} disabled={isEdit} />
                        <Inp label="Quốc gia *" v={form.country} onChange={(v) => upd("country", v)} />
                    </div>
                    <Inp label="Tên Supplier *" v={form.supplierName} onChange={(v) => upd("supplierName", v)} />
                    <div className="grid grid-cols-2 gap-4">
                        <Inp label="Người liên hệ" v={form.contactPerson} onChange={(v) => upd("contactPerson", v)} />
                        <Inp label="SĐT" v={form.phone} onChange={(v) => upd("phone", v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Inp label="Email" v={form.email} onChange={(v) => upd("email", v)} />
                        <Inp label="Điều khoản TT" v={form.paymentTerms} onChange={(v) => upd("paymentTerms", v)} placeholder="COD / Net 30" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Tiền tệ</label>
                            <select value={form.currency} onChange={(e) => upd("currency", e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                                <option value="VND">VND</option>
                                <option value="USD">USD</option>
                                <option value="CNY">CNY</option>
                            </select>
                        </div>
                        <Inp label="Lead time (ngày)" v={form.leadTimeDays} onChange={(v) => upd("leadTimeDays", v)} type="number" />
                        <Inp label="Rating (1-5)" v={form.rating} onChange={(v) => upd("rating", v)} type="number" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Ghi chú</label>
                        <textarea value={form.notes} onChange={(e) => upd("notes", e.target.value)} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Hủy</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f] transition-colors disabled:opacity-50">
                            {saving ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ================================================================
   PO TAB
   ================================================================ */

function POTab() {
    const [orders, setOrders] = useState<PO[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterSupplier, setFilterSupplier] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterSupplier) params.set("supplierId", filterSupplier);
            if (filterStatus) params.set("status", filterStatus);
            if (filterMonth) params.set("month", filterMonth);
            const res = await fetch(`/api/purchase-orders?${params}`);
            const data = await res.json();
            setOrders(data.orders);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [filterSupplier, filterStatus, filterMonth]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        fetch("/api/suppliers")
            .then((r) => r.json())
            .then((d) => setSuppliers(d.suppliers || []))
            .catch(() => { });
    }, []);

    return (
        <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div className="flex flex-wrap gap-3">
                    <select
                        value={filterSupplier}
                        onChange={(e) => setFilterSupplier(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">Tất cả Supplier</option>
                        {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.supplierName}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">Tất cả Status</option>
                        {Object.entries(PO_STATUS).map(([k, v]) => (
                            <option key={k} value={k}>
                                {v.label}
                            </option>
                        ))}
                    </select>
                    <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4f7f] transition-colors shrink-0"
                >
                    <Plus size={16} />
                    Tạo PO mới
                </button>
            </div>

            {/* PO Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                {[
                                    "PO số",
                                    "Supplier",
                                    "Ngày tạo",
                                    "Tổng tiền",
                                    "Giao dự kiến",
                                    "Status",
                                    "Thanh toán",
                                    "Hành động",
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-gray-400">
                                        Chưa có PO nào
                                    </td>
                                </tr>
                            ) : (
                                orders.map((po) => {
                                    const st = PO_STATUS[po.status as POStatusKey];
                                    const pay =
                                        PAYMENT_STATUS[po.paymentStatus as PaymentStatusKey];
                                    return (
                                        <tr
                                            key={po.id}
                                            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-mono text-sm font-medium text-gray-700">
                                                {po.poNumber}
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                {po.supplier.supplierName}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {formatDate(po.createdAt)}
                                            </td>
                                            <td className="px-4 py-3 font-medium tabular-nums">
                                                {formatCurrency(
                                                    Number(po.totalAmount),
                                                    po.currency
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">
                                                {po.expectedDelivery
                                                    ? formatDate(po.expectedDelivery)
                                                    : "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st?.color || "bg-gray-100 text-gray-500"}`}
                                                >
                                                    {st?.label || po.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pay?.color || "bg-gray-100 text-gray-500"}`}
                                                >
                                                    {pay?.label || po.paymentStatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Link
                                                    href={`/suppliers/orders/${po.id}`}
                                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    <Eye size={14} />
                                                    Chi tiết
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create PO Modal */}
            {showCreate && (
                <CreatePOModal
                    suppliers={suppliers}
                    onClose={() => setShowCreate(false)}
                    onCreated={fetchOrders}
                />
            )}
        </>
    );
}

/* ================================================================
   CREATE PO MODAL (3-step)
   ================================================================ */

interface POItem {
    materialId: string;
    materialCode: string;
    materialName: string;
    unit: string;
    quantity: string;
    unitPrice: string;
}

function CreatePOModal({
    suppliers,
    onClose,
    onCreated,
}: {
    suppliers: Supplier[];
    onClose: () => void;
    onCreated: () => void;
}) {
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [materials, setMaterials] = useState<MaterialOption[]>([]);
    const [matSearch, setMatSearch] = useState("");

    // Step 1
    const [form, setForm] = useState({
        supplierId: "",
        expectedDelivery: "",
        shippingMethod: "Sea",
        notes: "",
    });

    // Step 2
    const [items, setItems] = useState<POItem[]>([]);

    useEffect(() => {
        fetch("/api/materials?limit=100")
            .then((r) => r.json())
            .then((d) => setMaterials(d.materials || []))
            .catch(() => { });
    }, []);

    const selectedSupplier = suppliers.find((s) => s.id === form.supplierId);

    const filteredMats = materials.filter(
        (m) =>
            !items.some((i) => i.materialId === m.id) &&
            (m.materialCode.toLowerCase().includes(matSearch.toLowerCase()) ||
                m.materialName.toLowerCase().includes(matSearch.toLowerCase()))
    );

    const addItem = (mat: MaterialOption) => {
        setItems([
            ...items,
            {
                materialId: mat.id,
                materialCode: mat.materialCode,
                materialName: mat.materialName,
                unit: mat.unit,
                quantity: "100",
                unitPrice: String(Number(mat.avgUnitCost)),
            },
        ]);
        setMatSearch("");
    };

    const totalAmount = items.reduce(
        (s, i) => s + (parseFloat(i.quantity) || 0) * (parseFloat(i.unitPrice) || 0),
        0
    );

    const handleSubmit = async () => {
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/purchase-orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    totalAmount,
                    currency: selectedSupplier?.currency || "VND",
                    items: items.map((i) => ({
                        materialId: i.materialId,
                        quantity: parseFloat(i.quantity) || 0,
                        unitPrice: parseFloat(i.unitPrice) || 0,
                    })),
                }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            onCreated();
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Tạo PO mới</h2>
                        <p className="text-sm text-gray-400">
                            Bước {step}/3 —{" "}
                            {step === 1
                                ? "Thông tin đơn"
                                : step === 2
                                    ? "Thêm nguyên liệu"
                                    : "Xem lại"}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                            {error}
                        </div>
                    )}

                    {/* Step 1 */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Supplier *</label>
                                <select
                                    value={form.supplierId}
                                    onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    <option value="">— Chọn supplier —</option>
                                    {suppliers.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.supplierCode} — {s.supplierName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Inp label="Ngày giao dự kiến *" v={form.expectedDelivery} onChange={(v) => setForm({ ...form, expectedDelivery: v })} type="date" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Phương thức ship</label>
                                    <select value={form.shippingMethod} onChange={(e) => setForm({ ...form, shippingMethod: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                                        <option value="Sea">🚢 Sea</option>
                                        <option value="Air">✈️ Air</option>
                                        <option value="Express">🚀 Express</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Ghi chú</label>
                                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => {
                                        if (!form.supplierId || !form.expectedDelivery) {
                                            setError("Vui lòng chọn Supplier và ngày giao");
                                            return;
                                        }
                                        setError("");
                                        setStep(2);
                                    }}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f] transition-colors"
                                >
                                    Tiếp theo <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2 */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm nguyên liệu..."
                                    value={matSearch}
                                    onChange={(e) => setMatSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                {matSearch && filteredMats.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {filteredMats.map((m) => (
                                            <button key={m.id} onClick={() => addItem(m)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
                                                <span className="font-mono text-gray-400 mr-2">{m.materialCode}</span>
                                                {m.materialName}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {items.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-b">
                                                <th className="text-left px-3 py-2 font-semibold text-gray-600">Nguyên liệu</th>
                                                <th className="text-center px-3 py-2 font-semibold text-gray-600 w-24">Số lượng</th>
                                                <th className="text-center px-3 py-2 font-semibold text-gray-600 w-28">Đơn giá</th>
                                                <th className="text-right px-3 py-2 font-semibold text-gray-600 w-28">Thành tiền</th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, idx) => (
                                                <tr key={idx} className="border-b border-gray-100">
                                                    <td className="px-3 py-2">
                                                        <span className="font-mono text-xs text-gray-400 mr-1">{item.materialCode}</span>
                                                        <span className="text-gray-700">{item.materialName}</span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" value={item.quantity} onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], quantity: e.target.value }; setItems(n); }} className="w-full text-center border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input type="number" value={item.unitPrice} onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], unitPrice: e.target.value }; setItems(n); }} className="w-full text-center border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                                    </td>
                                                    <td className="px-3 py-2 text-right font-medium">
                                                        {formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), selectedSupplier?.currency || "VND")}
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="px-3 py-2 bg-blue-50 text-sm font-medium flex justify-between">
                                        <span className="text-gray-600">Tổng cộng</span>
                                        <span className="text-blue-700 font-bold">{formatCurrency(totalAmount, selectedSupplier?.currency || "VND")}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                                    <p>Chưa có nguyên liệu nào</p>
                                    <p className="text-xs mt-1">Tìm và thêm ở ô phía trên</p>
                                </div>
                            )}

                            <div className="flex justify-between pt-2">
                                <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"><ChevronLeft size={16} /> Quay lại</button>
                                <button
                                    onClick={() => {
                                        if (items.length === 0) { setError("Vui lòng thêm ít nhất 1 nguyên liệu"); return; }
                                        setError(""); setStep(3);
                                    }}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f]"
                                >Tiếp theo <ChevronRight size={16} /></button>
                            </div>
                        </div>
                    )}

                    {/* Step 3 — Review */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Supplier:</span>
                                    <span className="font-medium text-gray-800">{selectedSupplier?.supplierName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Ngày giao dự kiến:</span>
                                    <span className="font-medium text-gray-800">{formatDate(form.expectedDelivery)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Ship:</span>
                                    <span className="font-medium text-gray-800">{form.shippingMethod}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Số dòng:</span>
                                    <span className="font-medium text-gray-800">{items.length} nguyên liệu</span>
                                </div>
                                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                                    <span className="text-gray-700 font-semibold">Tổng cộng:</span>
                                    <span className="text-blue-700 font-bold text-lg">{formatCurrency(totalAmount, selectedSupplier?.currency || "VND")}</span>
                                </div>
                            </div>

                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b">
                                            <th className="text-left px-3 py-2 font-semibold text-gray-600">Nguyên liệu</th>
                                            <th className="text-right px-3 py-2 font-semibold text-gray-600">SL</th>
                                            <th className="text-right px-3 py-2 font-semibold text-gray-600">Đơn giá</th>
                                            <th className="text-right px-3 py-2 font-semibold text-gray-600">Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, idx) => (
                                            <tr key={idx} className="border-b border-gray-100">
                                                <td className="px-3 py-2 text-gray-700">{item.materialName}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{Number(item.quantity).toLocaleString("vi-VN")}</td>
                                                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(Number(item.unitPrice), selectedSupplier?.currency || "VND")}</td>
                                                <td className="px-3 py-2 text-right font-medium tabular-nums">{formatCurrency((parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), selectedSupplier?.currency || "VND")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-between pt-2">
                                <button onClick={() => setStep(2)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"><ChevronLeft size={16} /> Quay lại</button>
                                <button onClick={handleSubmit} disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f] disabled:opacity-50">
                                    {saving ? "Đang tạo..." : "✅ Tạo PO"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   SHARED INPUT
   ================================================================ */

function Inp({
    label,
    v,
    onChange,
    placeholder,
    type = "text",
    disabled,
}: {
    label: string;
    v: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    disabled?: boolean;
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
            <input type={type} value={v} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400" />
        </div>
    );
}
