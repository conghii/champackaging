"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Package,
    Plus,
    ArrowRight,
    X,
    ChevronRight,
    ChevronLeft,
    Search,
    Trash2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

// ============================================================
// Types
// ============================================================

interface FBAInv {
    id: string;
    fulfillableQty: number;
    inboundQty: number;
    reservedQty: number;
}

interface BomItem {
    id: string;
    materialId: string;
    quantityPerUnit: string | number;
    wastagePercent: string | number;
    material: { materialCode: string; materialName: string; avgUnitCost: string | number; unit: string };
}

interface Product {
    id: string;
    skuCode: string;
    productName: string;
    category: string | null;
    amazonAsin: string | null;
    amazonFnsku: string | null;
    sellingPrice: string | number;
    minStockFba: number;
    leadTimeDays: number;
    status: "ACTIVE" | "INACTIVE";
    fbaInventory: FBAInv[];
    billOfMaterials: BomItem[];
}

interface MaterialOption {
    id: string;
    materialCode: string;
    materialName: string;
    unit: string;
    avgUnitCost: string | number;
}

// ============================================================
// Main Component
// ============================================================

export default function ProductsClient() {
    const [products, setProducts] = useState<Product[]>([]);
    const [activeCount, setActiveCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/products");
            const data = await res.json();
            setProducts(data.products);
            setActiveCount(data.activeCount);
        } catch (err) {
            console.error("Fetch products failed:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Sản phẩm & SKU</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {activeCount} SKU đang hoạt động
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4f7f] transition-colors"
                >
                    <Plus size={16} />
                    Thêm SKU mới
                </button>
            </div>

            {/* Product Cards Grid */}
            {loading ? (
                <div className="text-center py-20 text-gray-400">
                    Đang tải sản phẩm...
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 text-gray-400">
                    <Package size={48} className="mx-auto mb-3" strokeWidth={1.5} />
                    <p>Chưa có sản phẩm nào</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <CreateProductModal
                    onClose={() => setShowCreateModal(false)}
                    onCreated={fetchProducts}
                />
            )}
        </div>
    );
}

// ============================================================
// Product Card
// ============================================================

function ProductCard({ product }: { product: Product }) {
    const fba = product.fbaInventory[0];
    const fulfillable = fba?.fulfillableQty || 0;
    const isLowStock = fulfillable < product.minStockFba;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
            {/* Top area */}
            <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center text-3xl">
                    🎁
                </div>
                <span
                    className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${product.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                >
                    {product.status === "ACTIVE" ? "Active" : "Inactive"}
                </span>
            </div>

            {/* SKU Badge */}
            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-mono rounded mb-2">
                {product.skuCode}
            </span>

            {/* Name */}
            <h3 className="font-semibold text-gray-800 mb-3 line-clamp-2 leading-snug">
                {product.productName}
            </h3>

            {/* Price + FBA Stock */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-bold text-blue-600">
                    {formatCurrency(product.sellingPrice)}
                </span>
                <div className="text-right">
                    <p className="text-xs text-gray-400">Tồn FBA</p>
                    <p
                        className={`text-lg font-bold ${isLowStock ? "text-red-500" : "text-emerald-600"
                            }`}
                    >
                        {fulfillable}
                    </p>
                </div>
            </div>

            {/* Detail Link */}
            <Link
                href={`/products/${product.id}`}
                className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-[#1E3A5F] bg-[#1E3A5F]/5 rounded-lg hover:bg-[#1E3A5F]/10 transition-colors group-hover:bg-[#1E3A5F]/10"
            >
                Xem chi tiết
                <ArrowRight size={14} />
            </Link>
        </div>
    );
}

// ============================================================
// Create Product Modal (2-step)
// ============================================================

interface BomEntry {
    materialId: string;
    materialCode: string;
    materialName: string;
    unit: string;
    quantityPerUnit: string;
    wastagePercent: string;
    avgUnitCost: number;
}

function CreateProductModal({
    onClose,
    onCreated,
}: {
    onClose: () => void;
    onCreated: () => void;
}) {
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Step 1 fields
    const [form, setForm] = useState({
        productName: "",
        skuCode: "",
        category: "",
        amazonAsin: "",
        amazonFnsku: "",
        sellingPrice: "",
        minStockFba: "80",
        leadTimeDays: "21",
    });

    // Step 2: BOM
    const [bomEntries, setBomEntries] = useState<BomEntry[]>([]);
    const [materials, setMaterials] = useState<MaterialOption[]>([]);
    const [matSearch, setMatSearch] = useState("");

    // Fetch materials for BOM dropdown
    useEffect(() => {
        fetch("/api/materials?limit=100")
            .then((r) => r.json())
            .then((data) => setMaterials(data.materials || []))
            .catch(() => { });
    }, []);

    const filteredMaterials = materials.filter(
        (m) =>
            !bomEntries.some((b) => b.materialId === m.id) &&
            (m.materialCode.toLowerCase().includes(matSearch.toLowerCase()) ||
                m.materialName.toLowerCase().includes(matSearch.toLowerCase()))
    );

    const addMaterial = (mat: MaterialOption) => {
        setBomEntries([
            ...bomEntries,
            {
                materialId: mat.id,
                materialCode: mat.materialCode,
                materialName: mat.materialName,
                unit: mat.unit,
                quantityPerUnit: "1",
                wastagePercent: "3",
                avgUnitCost: Number(mat.avgUnitCost),
            },
        ]);
        setMatSearch("");
    };

    const removeBomEntry = (idx: number) => {
        setBomEntries(bomEntries.filter((_, i) => i !== idx));
    };

    const updateBomEntry = (idx: number, field: string, value: string) => {
        setBomEntries(
            bomEntries.map((e, i) => (i === idx ? { ...e, [field]: value } : e))
        );
    };

    const totalMaterialCost = bomEntries.reduce((sum, e) => {
        const qty = parseFloat(e.quantityPerUnit) || 0;
        const wastage = 1 + (parseFloat(e.wastagePercent) || 0) / 100;
        return sum + qty * wastage * e.avgUnitCost;
    }, 0);

    const handleNext = () => {
        if (!form.productName.trim() || !form.skuCode.trim() || !form.sellingPrice) {
            setError("Vui lòng điền Tên SP, SKU code và Giá bán");
            return;
        }
        setError("");
        setStep(2);
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...form,
                    sellingPrice: parseFloat(form.sellingPrice) || 0,
                    minStockFba: parseInt(form.minStockFba) || 0,
                    leadTimeDays: parseInt(form.leadTimeDays) || 0,
                    bom: bomEntries.map((e) => ({
                        materialId: e.materialId,
                        quantityPerUnit: parseFloat(e.quantityPerUnit) || 0,
                        wastagePercent: parseFloat(e.wastagePercent) || 0,
                    })),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

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
                        <h2 className="text-lg font-bold text-gray-800">
                            Thêm SKU mới
                        </h2>
                        <p className="text-sm text-gray-400">
                            Bước {step}/2 —{" "}
                            {step === 1 ? "Thông tin sản phẩm" : "Bill of Materials"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                            {error}
                        </div>
                    )}

                    {/* ===== STEP 1 ===== */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Tên sản phẩm *"
                                    value={form.productName}
                                    onChange={(v) => setForm({ ...form, productName: v })}
                                    placeholder="Positive Affirmation Jar"
                                />
                                <Field
                                    label="SKU Code *"
                                    value={form.skuCode}
                                    onChange={(v) => setForm({ ...form, skuCode: v })}
                                    placeholder="GIFT-JAR-002"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Category"
                                    value={form.category}
                                    onChange={(v) => setForm({ ...form, category: v })}
                                    placeholder="Home & Kitchen"
                                />
                                <Field
                                    label="Giá bán (USD) *"
                                    value={form.sellingPrice}
                                    onChange={(v) => setForm({ ...form, sellingPrice: v })}
                                    type="number"
                                    placeholder="28.99"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Amazon ASIN"
                                    value={form.amazonAsin}
                                    onChange={(v) => setForm({ ...form, amazonAsin: v })}
                                    placeholder="B0XXXXXXXX"
                                />
                                <Field
                                    label="Amazon FNSKU"
                                    value={form.amazonFnsku}
                                    onChange={(v) => setForm({ ...form, amazonFnsku: v })}
                                    placeholder="X00XXXXXXX"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="Min FBA Stock"
                                    value={form.minStockFba}
                                    onChange={(v) => setForm({ ...form, minStockFba: v })}
                                    type="number"
                                />
                                <Field
                                    label="Lead Time (ngày)"
                                    value={form.leadTimeDays}
                                    onChange={(v) => setForm({ ...form, leadTimeDays: v })}
                                    type="number"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f] transition-colors"
                                >
                                    Tiếp theo
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ===== STEP 2 ===== */}
                    {step === 2 && (
                        <div className="space-y-4">
                            {/* Material search */}
                            <div className="relative">
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    type="text"
                                    placeholder="Tìm nguyên liệu để thêm..."
                                    value={matSearch}
                                    onChange={(e) => setMatSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                {matSearch && filteredMaterials.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {filteredMaterials.map((m) => (
                                            <button
                                                key={m.id}
                                                onClick={() => addMaterial(m)}
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm flex justify-between"
                                            >
                                                <span>
                                                    <span className="font-mono text-gray-400 mr-2">
                                                        {m.materialCode}
                                                    </span>
                                                    {m.materialName}
                                                </span>
                                                <span className="text-gray-400">{m.unit}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* BOM Table */}
                            {bomEntries.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-50 border-b">
                                                <th className="text-left px-3 py-2 font-semibold text-gray-600">
                                                    Nguyên liệu
                                                </th>
                                                <th className="text-center px-3 py-2 font-semibold text-gray-600 w-20">
                                                    SL/unit
                                                </th>
                                                <th className="text-center px-3 py-2 font-semibold text-gray-600 w-20">
                                                    Hao phí %
                                                </th>
                                                <th className="text-right px-3 py-2 font-semibold text-gray-600 w-24">
                                                    Giá NL
                                                </th>
                                                <th className="w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bomEntries.map((entry, idx) => (
                                                <tr key={idx} className="border-b border-gray-100">
                                                    <td className="px-3 py-2">
                                                        <span className="font-mono text-xs text-gray-400 mr-1">
                                                            {entry.materialCode}
                                                        </span>
                                                        <span className="text-gray-700">
                                                            {entry.materialName}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            value={entry.quantityPerUnit}
                                                            onChange={(e) =>
                                                                updateBomEntry(
                                                                    idx,
                                                                    "quantityPerUnit",
                                                                    e.target.value
                                                                )
                                                            }
                                                            min="0"
                                                            step="any"
                                                            className="w-full text-center border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="number"
                                                            value={entry.wastagePercent}
                                                            onChange={(e) =>
                                                                updateBomEntry(
                                                                    idx,
                                                                    "wastagePercent",
                                                                    e.target.value
                                                                )
                                                            }
                                                            min="0"
                                                            step="any"
                                                            className="w-full text-center border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-gray-500">
                                                        {formatCurrency(entry.avgUnitCost, "VND")}
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <button
                                                            onClick={() => removeBomEntry(idx)}
                                                            className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <div className="px-3 py-2 bg-blue-50 text-sm font-medium flex justify-between">
                                        <span className="text-gray-600">
                                            Total Material Cost/unit
                                        </span>
                                        <span className="text-blue-700">
                                            {formatCurrency(totalMaterialCost, "VND")}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-lg">
                                    <p>Chưa có nguyên liệu nào</p>
                                    <p className="text-xs mt-1">
                                        Tìm và thêm nguyên liệu ở ô phía trên
                                    </p>
                                </div>
                            )}

                            {/* Footer buttons */}
                            <div className="flex justify-between pt-2">
                                <button
                                    onClick={() => setStep(1)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                    Quay lại
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={saving}
                                    className="px-5 py-2 text-sm font-medium text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f] transition-colors disabled:opacity-50"
                                >
                                    {saving ? "Đang tạo..." : "Tạo sản phẩm"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Shared Field
// ============================================================

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
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
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
        </div>
    );
}
