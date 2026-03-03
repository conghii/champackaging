"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Copy,
    Check,
    ClipboardList,
    BarChart3,
    ShoppingCart,
    Wrench,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WORK_ORDER_STATUS, type WorkOrderStatusKey } from "@/lib/constants";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

// ============================================================
// Types
// ============================================================

interface Material {
    materialCode: string;
    materialName: string;
    unit: string;
    avgUnitCost: string | number;
}

interface BomItem {
    id: string;
    materialId: string;
    quantityPerUnit: string | number;
    wastagePercent: string | number;
    notes: string | null;
    material: Material;
}

interface FBAInv {
    fulfillableQty: number;
    inboundQty: number;
    reservedQty: number;
    updatedDate: string;
}

interface WorkOrder {
    id: string;
    woNumber: string;
    quantityPlanned: number;
    quantityCompleted: number;
    status: string;
    createdAt: string;
}

interface SaleRecord {
    saleDate: string;
    unitsSold: number;
    revenue: string | number;
    returns: number;
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
    billOfMaterials: BomItem[];
    fbaInventory: FBAInv[];
    workOrders: WorkOrder[];
}

// ============================================================
// Main Component
// ============================================================

export default function ProductDetailClient() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [salesData, setSalesData] = useState<SaleRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        fetch(`/api/products/${id}`)
            .then((r) => r.json())
            .then((data) => {
                setProduct(data.product);
                setSalesData(data.salesData || []);
            })
            .catch((err) => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="text-center py-20 text-gray-400">
                Đang tải chi tiết sản phẩm...
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-20 text-gray-400">
                Không tìm thấy sản phẩm
            </div>
        );
    }

    const fba = product.fbaInventory[0];
    const tabs = [
        { label: "Bill of Materials", icon: ClipboardList },
        { label: "Tồn kho FBA", icon: ShoppingCart },
        { label: "Doanh số", icon: BarChart3 },
        { label: "Work Orders", icon: Wrench },
    ];

    return (
        <div className="space-y-6">
            {/* Back button */}
            <button
                onClick={() => router.push("/products")}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                <ArrowLeft size={16} />
                Quay lại danh sách
            </button>

            {/* 2-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* LEFT — Product Info (2/5) */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                        {/* Icon */}
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center text-5xl mx-auto">
                            🎁
                        </div>

                        {/* Name + SKU */}
                        <div className="text-center">
                            <h1 className="text-xl font-bold text-gray-800">
                                {product.productName}
                            </h1>
                            <span className="inline-block mt-2 px-3 py-0.5 bg-gray-100 text-gray-500 text-xs font-mono rounded-full">
                                {product.skuCode}
                            </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-3 pt-2">
                            <InfoRow label="Category" value={product.category || "—"} />
                            <InfoRowCopy label="ASIN" value={product.amazonAsin} />
                            <InfoRowCopy label="FNSKU" value={product.amazonFnsku} />
                            <InfoRow
                                label="Giá bán"
                                value={formatCurrency(product.sellingPrice)}
                                highlight
                            />
                            <InfoRow
                                label="Min FBA Stock"
                                value={`${product.minStockFba} units`}
                            />
                            <InfoRow
                                label="Lead Time"
                                value={`${product.leadTimeDays} ngày`}
                            />
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Trạng thái</span>
                            <span
                                className={`px-3 py-1 text-xs font-medium rounded-full ${product.status === "ACTIVE"
                                        ? "bg-green-100 text-green-700"
                                        : "bg-gray-100 text-gray-500"
                                    }`}
                            >
                                {product.status === "ACTIVE" ? "✅ Active" : "⏸ Inactive"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* RIGHT — Tabs (3/5) */}
                <div className="lg:col-span-3">
                    {/* Tab headers */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-4">
                        {tabs.map((tab, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveTab(idx)}
                                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md flex-1 justify-center transition-colors ${activeTab === idx
                                        ? "bg-white text-gray-800 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                    }`}
                            >
                                <tab.icon size={15} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab content */}
                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                        {activeTab === 0 && (
                            <BomTab bom={product.billOfMaterials} />
                        )}
                        {activeTab === 1 && (
                            <FbaTab fba={fba} salesData={salesData} minStock={product.minStockFba} />
                        )}
                        {activeTab === 2 && (
                            <SalesTab salesData={salesData} sellingPrice={Number(product.sellingPrice)} />
                        )}
                        {activeTab === 3 && (
                            <WorkOrdersTab workOrders={product.workOrders} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================
// Info Row Components
// ============================================================

function InfoRow({
    label,
    value,
    highlight,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{label}</span>
            <span
                className={`text-sm font-medium ${highlight ? "text-blue-600" : "text-gray-800"}`}
            >
                {value}
            </span>
        </div>
    );
}

function InfoRowCopy({
    label,
    value,
}: {
    label: string;
    value: string | null;
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">{label}</span>
            {value ? (
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-sm font-mono text-gray-800 hover:text-blue-600 transition-colors"
                >
                    {value}
                    {copied ? (
                        <Check size={13} className="text-green-500" />
                    ) : (
                        <Copy size={13} className="text-gray-400" />
                    )}
                </button>
            ) : (
                <span className="text-sm text-gray-400">—</span>
            )}
        </div>
    );
}

// ============================================================
// TAB 1 - Bill of Materials
// ============================================================

function BomTab({ bom }: { bom: BomItem[] }) {
    const totalCost = bom.reduce((sum, item) => {
        const qty = Number(item.quantityPerUnit);
        const wastage = 1 + Number(item.wastagePercent) / 100;
        const cost = Number(item.material.avgUnitCost);
        return sum + qty * wastage * cost;
    }, 0);

    if (bom.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                Chưa có BOM nào được thiết lập
            </div>
        );
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-2 font-semibold text-gray-600">
                                Mã NL
                            </th>
                            <th className="text-left py-2 px-2 font-semibold text-gray-600">
                                Tên NL
                            </th>
                            <th className="text-center py-2 px-2 font-semibold text-gray-600">
                                SL/unit
                            </th>
                            <th className="text-center py-2 px-2 font-semibold text-gray-600">
                                Đơn vị
                            </th>
                            <th className="text-center py-2 px-2 font-semibold text-gray-600">
                                Hao phí %
                            </th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-600">
                                Giá NL
                            </th>
                            <th className="text-right py-2 px-2 font-semibold text-gray-600">
                                Chi phí/unit
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {bom.map((item) => {
                            const qty = Number(item.quantityPerUnit);
                            const wastage = 1 + Number(item.wastagePercent) / 100;
                            const unitCost = Number(item.material.avgUnitCost);
                            const costPerUnit = qty * wastage * unitCost;

                            return (
                                <tr
                                    key={item.id}
                                    className="border-b border-gray-100 hover:bg-gray-50/50"
                                >
                                    <td className="py-2 px-2 font-mono text-xs text-gray-400">
                                        {item.material.materialCode}
                                    </td>
                                    <td className="py-2 px-2 text-gray-700">
                                        {item.material.materialName}
                                    </td>
                                    <td className="py-2 px-2 text-center font-medium">
                                        {qty}
                                    </td>
                                    <td className="py-2 px-2 text-center text-gray-500">
                                        {item.material.unit}
                                    </td>
                                    <td className="py-2 px-2 text-center text-gray-500">
                                        {Number(item.wastagePercent)}%
                                    </td>
                                    <td className="py-2 px-2 text-right text-gray-500">
                                        {formatCurrency(unitCost, "VND")}
                                    </td>
                                    <td className="py-2 px-2 text-right font-medium text-gray-800">
                                        {formatCurrency(costPerUnit, "VND")}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-blue-50">
                            <td
                                colSpan={6}
                                className="py-2 px-2 font-semibold text-gray-600"
                            >
                                Total Material Cost / unit
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-blue-700">
                                {formatCurrency(totalCost, "VND")}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}

// ============================================================
// TAB 2 - FBA Inventory
// ============================================================

function FbaTab({
    fba,
    salesData,
    minStock,
}: {
    fba: FBAInv | undefined;
    salesData: SaleRecord[];
    minStock: number;
}) {
    const fulfillable = fba?.fulfillableQty || 0;
    const inbound = fba?.inboundQty || 0;
    const reserved = fba?.reservedQty || 0;

    // Calculate daily velocity from last 7 days of sales
    const last7 = salesData.slice(-7);
    const totalUnits7d = last7.reduce((s, d) => s + d.unitsSold, 0);
    const avgDaily = last7.length > 0 ? totalUnits7d / last7.length : 0;
    const daysOfSupply = avgDaily > 0 ? Math.round(fulfillable / avgDaily) : 999;

    const isLow = fulfillable < minStock;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p
                        className={`text-3xl font-bold ${isLow ? "text-red-500" : "text-emerald-600"}`}
                    >
                        {fulfillable}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Fulfillable</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-3xl font-bold text-blue-600">{inbound}</p>
                    <p className="text-sm text-gray-500 mt-1">Inbound</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                    <p className="text-3xl font-bold text-orange-500">{reserved}</p>
                    <p className="text-sm text-gray-500 mt-1">Reserved</p>
                </div>
            </div>

            {/* Days of supply forecast */}
            <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Ngày hết hàng dự báo</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">
                            {daysOfSupply >= 999 ? "N/A" : `${daysOfSupply} ngày`}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Tốc độ bán TB</p>
                        <p className="text-lg font-bold text-gray-700">
                            {avgDaily.toFixed(1)} units/ngày
                        </p>
                    </div>
                </div>
                {daysOfSupply < 30 && daysOfSupply < 999 && (
                    <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        ⚠️ Tồn kho FBA sẽ hết trong {daysOfSupply} ngày. Cần bổ sung sớm!
                    </div>
                )}
            </div>

            <div className="text-xs text-gray-400 text-right">
                Cập nhật: {fba ? formatDate(fba.updatedDate) : "—"}
            </div>
        </div>
    );
}

// ============================================================
// TAB 3 - Sales Data (recharts)
// ============================================================

function SalesTab({
    salesData,
    sellingPrice,
}: {
    salesData: SaleRecord[];
    sellingPrice: number;
}) {
    const chartData = salesData.map((d) => ({
        date: new Date(d.saleDate).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
        }),
        units: d.unitsSold,
        revenue: Number(d.revenue),
    }));

    const totalUnits = salesData.reduce((s, d) => s + d.unitsSold, 0);
    const totalRevenue = salesData.reduce((s, d) => s + Number(d.revenue), 0);
    const totalReturns = salesData.reduce((s, d) => s + d.returns, 0);
    const avgDaily =
        salesData.length > 0 ? totalUnits / salesData.length : 0;

    if (salesData.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                Chưa có dữ liệu doanh số
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Summary stats */}
            <div className="grid grid-cols-4 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-gray-800">{totalUnits}</p>
                    <p className="text-xs text-gray-500">Tổng units</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-emerald-600">
                        {formatCurrency(totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500">Tổng revenue</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">
                        {avgDaily.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">TB/ngày</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-xl font-bold text-orange-500">{totalReturns}</p>
                    <p className="text-xs text-gray-500">Returns</p>
                </div>
            </div>

            {/* Line Chart */}
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 12, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: "8px",
                                border: "1px solid #e5e7eb",
                                fontSize: "13px",
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="units"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ r: 4, fill: "#3b82f6" }}
                            name="Đã bán"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// ============================================================
// TAB 4 - Work Orders
// ============================================================

function WorkOrdersTab({ workOrders }: { workOrders: WorkOrder[] }) {
    if (workOrders.length === 0) {
        return (
            <div className="text-center py-8 text-gray-400">
                Chưa có Work Order nào
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">
                            WO Number
                        </th>
                        <th className="text-left py-2 px-2 font-semibold text-gray-600">
                            Ngày tạo
                        </th>
                        <th className="text-right py-2 px-2 font-semibold text-gray-600">
                            Số lượng
                        </th>
                        <th className="text-center py-2 px-2 font-semibold text-gray-600">
                            Trạng thái
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {workOrders.map((wo) => {
                        const statusConfig =
                            WORK_ORDER_STATUS[wo.status as WorkOrderStatusKey];
                        return (
                            <tr
                                key={wo.id}
                                className="border-b border-gray-100 hover:bg-gray-50/50"
                            >
                                <td className="py-2 px-2 font-mono text-gray-700">
                                    {wo.woNumber}
                                </td>
                                <td className="py-2 px-2 text-gray-500">
                                    {formatDate(wo.createdAt)}
                                </td>
                                <td className="py-2 px-2 text-right">
                                    <span className="font-medium">{wo.quantityCompleted}</span>
                                    <span className="text-gray-400">
                                        /{wo.quantityPlanned}
                                    </span>
                                </td>
                                <td className="py-2 px-2 text-center">
                                    {statusConfig ? (
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}
                                        >
                                            {statusConfig.label}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">{wo.status}</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
