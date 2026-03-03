"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, X, Eye, Package, TrendingUp, Truck, Copy, Check } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FBA_SHIPMENT_STATUS, type FBAShipmentStatusKey } from "@/lib/constants";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Line,
    ComposedChart,
    ResponsiveContainer
} from "recharts";

/* ================================================================
   TYPES
   ================================================================ */

interface FBAInventory {
    id: string;
    productId: string;
    fulfillableQty: number;
    inboundQty: number;
    reservedQty: number;
    velocity7d: number;
    product: { id: string; skuCode: string; productName: string; amazonAsin: string | null };
}

interface SalesRecord {
    id: string;
    saleDate: string;
    unitsSold: number;
    revenue: string;
    returns: number;
    product: { skuCode: string; productName: string };
}

interface Shipment {
    id: string;
    shipmentName: string;
    status: string;
    destinationFc: string | null;
    totalUnits: number;
    shipDate: string | null;
    shippingCost: string;
    trackingNumber: string | null;
    items: { product: { skuCode: string } }[];
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function FBAClient() {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Amazon FBA</h1>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
                    {[
                        { label: "Tồn kho FBA", icon: <Package size={16} /> },
                        { label: "Doanh số", icon: <TrendingUp size={16} /> },
                        { label: "FBA Shipments", icon: <Truck size={16} /> },
                    ].map((tab, idx) => (
                        <button
                            key={idx}
                            onClick={() => setActiveTab(idx)}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === idx
                                    ? "border-[#1E3A5F] text-[#1E3A5F] bg-white"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                                }`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 0 && <TabInventory />}
                    {activeTab === 1 && <TabSales />}
                    {activeTab === 2 && <TabShipments />}
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   TAB 1: INVENTORY
   ================================================================ */

function TabInventory() {
    const [data, setData] = useState<FBAInventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editInv, setEditInv] = useState<FBAInventory | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/fba/inventory");
            const d = await res.json();
            setData(d.inventory || []);
        } catch (err) {
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData() }, [fetchData]);

    const t_fulfillable = data.reduce((sum, item) => sum + item.fulfillableQty, 0);
    const t_critical = data.filter(item => item.velocity7d > 0 && (item.fulfillableQty / item.velocity7d) < 30).length;
    const t_outOfStock = data.filter(item => item.fulfillableQty === 0).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard title="Tổng Units Có Thể Bán" value={t_fulfillable.toLocaleString()} />
                <KPICard title="SKU sắp hết hàng (< 30d)" value={t_critical} isAlert={t_critical > 0} />
                <KPICard title="SKU hết hàng (0 unit)" value={t_outOfStock} isAlert={t_outOfStock > 0} />
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Sản phẩm (SKU)</th>
                            <th className="px-4 py-3 font-semibold">ASIN</th>
                            <th className="px-4 py-3 font-semibold text-right text-emerald-600">Có thể bán</th>
                            <th className="px-4 py-3 font-semibold text-right">Đang về (Inbound)</th>
                            <th className="px-4 py-3 font-semibold text-right text-yellow-600">Dự trữ</th>
                            <th className="px-4 py-3 font-semibold text-right">Velocity/ngày</th>
                            <th className="px-4 py-3 font-semibold text-right">Hết hàng sau</th>
                            <th className="px-4 py-3 font-semibold">Alert</th>
                            <th className="px-4 py-3 font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={9} className="py-8 text-center text-gray-400">Đang tải...</td></tr>
                        ) : data.length === 0 ? (
                            <tr><td colSpan={9} className="py-8 text-center text-gray-400">Chưa có dữ liệu</td></tr>
                        ) : data.map(row => {
                            const v = row.velocity7d;
                            const days = v > 0 ? Math.floor(row.fulfillableQty / v) : 999;

                            let alertObj = { label: "Ổn định", color: "bg-green-100 text-green-700", icon: "✅" };
                            let dayColor = "text-green-600";

                            if (row.fulfillableQty === 0) {
                                alertObj = { label: "Hết hàng", color: "bg-red-100 text-red-700", icon: "⛔" };
                                dayColor = "text-red-600";
                            } else if (days < 14) {
                                alertObj = { label: "Nguy hiểm", color: "bg-red-100 text-red-700", icon: "🔴" };
                                dayColor = "text-red-600";
                            } else if (days < 30) {
                                alertObj = { label: "Sắp hết", color: "bg-yellow-100 text-yellow-700", icon: "🟡" };
                                dayColor = "text-yellow-600";
                            }

                            return (
                                <tr key={row.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3">
                                        <span className="font-medium text-gray-800">{row.product.productName}</span>
                                        <div className="text-xs text-gray-500 font-mono">{row.product.skuCode}</div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-blue-600">
                                        {row.product.amazonAsin ? (
                                            <a href={`https://amazon.com/dp/${row.product.amazonAsin}`} target="_blank" rel="noreferrer" className="hover:underline">
                                                {row.product.amazonAsin}
                                            </a>
                                        ) : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums font-bold text-emerald-600">{row.fulfillableQty.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">{row.inboundQty.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-yellow-600 font-medium">{row.reservedQty.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">{v.toFixed(1)}</td>
                                    <td className={`px-4 py-3 text-right font-medium ${dayColor}`}>
                                        {row.fulfillableQty === 0 ? "0 ngày" : v === 0 ? "999+ ngày" : `~${days} ngày`}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium leading-none ${alertObj.color}`}>
                                            {alertObj.icon} {alertObj.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button onClick={() => setEditInv(row)} className="text-blue-600 hover:underline text-sm font-medium">Cập nhật</button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {editInv && (
                <UpdateInventoryModal
                    inv={editInv}
                    onClose={() => setEditInv(null)}
                    onUpdated={fetchData}
                />
            )}
        </div>
    );
}

function UpdateInventoryModal({ inv, onClose, onUpdated }: any) {
    const [fQty, setFQty] = useState(inv.fulfillableQty.toString());
    const [iQty, setIQty] = useState(inv.inboundQty.toString());
    const [rQty, setRQty] = useState(inv.reservedQty.toString());
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            await fetch(`/api/fba/inventory/${inv.id}`, {
                method: "PUT", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fulfillableQty: fQty, inboundQty: iQty, reservedQty: rQty })
            });
            onUpdated();
            onClose();
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="font-bold text-gray-800">Cập nhật FBA Inventory</h2>
                    <button onClick={onClose}><X size={18} className="text-gray-400" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div>
                        <p className="font-medium text-gray-800">{inv.product.productName}</p>
                        <p className="text-xs text-gray-500 font-mono">{inv.product.skuCode}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-emerald-600 mb-1">Fulfillable Qty (Có thể bán)</label>
                        <input type="number" min="0" value={fQty} onChange={(e) => setFQty(e.target.value)} required className="w-full border-2 border-emerald-100 focus:border-emerald-500 rounded-lg p-2 font-bold text-emerald-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Inbound Qty (Đang về)</label>
                        <input type="number" min="0" value={iQty} onChange={(e) => setIQty(e.target.value)} required className="w-full border-2 border-gray-100 focus:border-gray-400 rounded-lg p-2 font-bold text-gray-700 outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-yellow-600 mb-1">Reserved Qty (Dự trữ)</label>
                        <input type="number" min="0" value={rQty} onChange={(e) => setRQty(e.target.value)} required className="w-full border-2 border-yellow-100 focus:border-yellow-500 rounded-lg p-2 font-bold text-yellow-700 outline-none" />
                    </div>
                    <p className="text-xs text-blue-500 italic mt-2">Ghi chú: Nhập đúng số liệu từ báo cáo Seller Central.</p>
                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Hủy</button>
                        <button type="submit" disabled={saving} className="px-4 py-2 bg-[#1E3A5F] text-white font-medium rounded-lg">Lưu</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

/* ================================================================
   TAB 2: SALES
   ================================================================ */

function TabSales() {
    const [sales, setSales] = useState<SalesRecord[]>([]);
    const [loading, setLoading] = useState(true);

    // Basic date range: default 30 days
    const tempDate = new Date();
    tempDate.setDate(tempDate.getDate() - 30);

    const [startDate, setStartDate] = useState(tempDate.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);

    const [showInputModal, setShowInputModal] = useState(false);

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/fba/sales?startDate=${startDate}&endDate=${endDate}`);
            const d = await res.json();
            setSales(d.sales || []);
        } catch {
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    useEffect(() => { fetchSales() }, [fetchSales]);

    // Aggregating for chart
    const charDataObj: Record<string, { date: string, units: number, revenue: number }> = {};
    sales.forEach(s => {
        const d = s.saleDate.split("T")[0];
        if (!charDataObj[d]) charDataObj[d] = { date: d, units: 0, revenue: 0 };
        charDataObj[d].units += s.unitsSold;
        charDataObj[d].revenue += Number(s.revenue);
    });

    const chartData = Object.values(charDataObj).sort((a, b) => a.date.localeCompare(b.date));

    // Calculating summaries
    const totalUnits = sales.reduce((sum, s) => sum + s.unitsSold, 0);
    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.revenue), 0);
    const daysDiff = Math.max(1, (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24));
    const avgUnits = totalUnits / daysDiff;

    let bestDay = { date: "—", units: 0 };
    chartData.forEach(d => {
        if (d.units > bestDay.units) bestDay = d;
    });

    return (
        <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-end bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">Từ ngày</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-medium mb-1 block">Đến ngày</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
                    </div>
                </div>
                <button onClick={() => setShowInputModal(true)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                    <Plus size={16} /> Nhập số liệu hôm nay
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard title="Tổng Units" value={totalUnits.toLocaleString()} />
                <KPICard title="Doanh thu ($)" value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                <KPICard title="Trung bình (units/ngày)" value={avgUnits.toFixed(1)} />
                <KPICard title="Ngày bán cao nhất" value={bestDay.date !== "—" ? formatDate(bestDay.date) : "—"} subtitle={`${bestDay.units} units`} />
            </div>

            {/* CHART */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 h-[400px]">
                <h3 className="text-sm font-bold text-gray-800 mb-4">Biểu đồ Units & Doanh thu</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="date" tickFormatter={d => formatDate(d).substring(0, 5)} tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: "#3B82F6" }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={v => `$${v}`} tick={{ fontSize: 12, fill: "#F97316" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="units" name="Units Sold" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#F97316" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Ngày bán</th>
                            <th className="px-6 py-3 font-semibold">SKU / Sản phẩm</th>
                            <th className="px-6 py-3 font-semibold text-right">Units</th>
                            <th className="px-6 py-3 font-semibold text-right">Returns</th>
                            <th className="px-6 py-3 font-semibold text-right">Revenue ($)</th>
                            <th className="px-6 py-3 font-semibold text-right">Net Units</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="py-8 text-center text-gray-400">Đang tải...</td></tr>
                        ) : sales.length === 0 ? (
                            <tr><td colSpan={6} className="py-8 text-center text-gray-400">Không có dữ liệu trong khoảng thời gian này</td></tr>
                        ) : sales.map(s => (
                            <tr key={s.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-medium text-gray-800">{formatDate(s.saleDate)}</td>
                                <td className="px-6 py-4">
                                    <span className="font-mono text-xs text-gray-400 mr-2">{s.product.skuCode}</span>
                                    <span className="font-medium text-gray-800">{s.product.productName}</span>
                                </td>
                                <td className="px-6 py-4 text-right tabular-nums text-emerald-600 font-bold">{s.unitsSold}</td>
                                <td className="px-6 py-4 text-right tabular-nums text-red-500 font-medium">{s.returns > 0 ? `-${s.returns}` : 0}</td>
                                <td className="px-6 py-4 text-right tabular-nums text-gray-800 font-medium">${Number(s.revenue).toFixed(2)}</td>
                                <td className="px-6 py-4 text-right tabular-nums text-gray-600 font-medium">{s.unitsSold - s.returns}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showInputModal && <InputSalesModal onClose={() => setShowInputModal(false)} onSaved={fetchSales} />}
        </div>
    )
}

function InputSalesModal({ onClose, onSaved }: any) {
    const [products, setProducts] = useState<any[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [saving, setSaving] = useState(false);
    const [hasReturns, setHasReturns] = useState(false);

    const [rows, setRows] = useState<any[]>([]);

    useEffect(() => {
        fetch("/api/products?limit=100").then(r => r.json()).then(d => {
            const prs = d.products || [];
            setProducts(prs);
            setRows(prs.map((p: any) => ({
                productId: p.id, skuCode: p.skuCode, productName: p.productName,
                unitsSold: "0", revenue: "0", returns: "0"
            })));
        }).catch();
    }, []);

    const updateRow = (id: string, field: string, value: string) => {
        setRows(rows.map(r => r.productId === id ? { ...r, [field]: value } : r));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        const toSave = rows.filter(r => Number(r.unitsSold) > 0 || Number(r.revenue) > 0 || Number(r.returns) > 0).map(r => ({
            ...r, saleDate: date
        }));

        if (toSave.length === 0) return alert("Vui lòng nhập số liệu cho ít nhất 1 sản phẩm.");

        setSaving(true);
        try {
            await fetch("/api/fba/sales", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(toSave)
            });
            onSaved();
            onClose();
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-5 border-b shrink-0">
                    <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2"><TrendingUp size={20} className="text-emerald-600" /> Nhập doanh số</h2>
                    <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="p-5 border-b bg-gray-50 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-600">Ngày lưu báo cáo:</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-bold placeholder-gray-400" />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                            <input type="checkbox" checked={hasReturns} onChange={e => setHasReturns(e.target.checked)} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                            Nhập Return (Trả hàng)
                        </label>
                    </div>

                    <div className="p-5 overflow-y-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-500 sticky top-0 bg-white">
                                <tr>
                                    <th className="pb-2 font-medium w-1/2">Sản phẩm</th>
                                    <th className="pb-2 font-medium">Units Sold</th>
                                    <th className="pb-2 font-medium">Revenue ($)</th>
                                    {hasReturns && <th className="pb-2 font-medium text-red-500">Returns</th>}
                                </tr>
                            </thead>
                            <tbody className="space-y-4 space-y-reverse border-t">
                                {rows.map(r => (
                                    <tr key={r.productId} className="border-b last:border-0">
                                        <td className="py-3 pr-4">
                                            <span className="font-medium text-gray-800 line-clamp-1">{r.productName}</span>
                                            <span className="text-xs text-gray-500 font-mono">{r.skuCode}</span>
                                        </td>
                                        <td className="py-3 pr-4">
                                            <input type="number" min="0" value={r.unitsSold} onChange={(e) => updateRow(r.productId, 'unitsSold', e.target.value)} className="w-20 px-2 py-1.5 border border-gray-200 rounded bg-emerald-50 text-emerald-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                                        </td>
                                        <td className="py-3 pr-4">
                                            <div className="relative w-24">
                                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                                                <input type="number" step="0.01" min="0" value={r.revenue} onChange={(e) => updateRow(r.productId, 'revenue', e.target.value)} className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                                            </div>
                                        </td>
                                        {hasReturns && (
                                            <td className="py-3">
                                                <input type="number" min="0" value={r.returns} onChange={(e) => updateRow(r.productId, 'returns', e.target.value)} className="w-16 px-2 py-1.5 border border-gray-200 rounded bg-red-50 text-red-600 font-bold focus:outline-none focus:ring-2 focus:ring-red-500/30" />
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-5 border-t flex justify-end gap-3 bg-gray-50 shrink-0">
                        <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100">Hủy</button>
                        <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">
                            {saving ? "Đang lưu..." : "Lưu tất cả Doanh số"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

/* ================================================================
   TAB 3: SHIPMENTS
   ================================================================ */

function TabShipments() {
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchShip = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/fba/shipments");
            const d = await res.json();
            setShipments(d.shipments || []);
        } catch { } finally { setLoading(false) }
    }, []);

    useEffect(() => { fetchShip() }, [fetchShip]);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Link href="/fba/shipments/create" className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4f7f]">
                    <Plus size={16} /> Tạo lô hàng mới
                </Link>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                        <tr>
                            <th className="px-4 py-3 font-semibold">Tên Lô Hàng</th>
                            <th className="px-4 py-3 font-semibold">SKUs</th>
                            <th className="px-4 py-3 font-semibold text-right">Tổng Units</th>
                            <th className="px-4 py-3 font-semibold">Ngày Ship</th>
                            <th className="px-4 py-3 font-semibold">FC Đến</th>
                            <th className="px-4 py-3 font-semibold">Tracking</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={8} className="py-8 text-center text-gray-400">Đang tải...</td></tr>
                        ) : shipments.length === 0 ? (
                            <tr><td colSpan={8} className="py-8 text-center text-gray-400">Không có lô hàng FBA nào</td></tr>
                        ) : shipments.map(sh => {
                            const st = FBA_SHIPMENT_STATUS[sh.status as FBAShipmentStatusKey];

                            return (
                                <tr key={sh.id} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-4 font-bold text-gray-800">{sh.shipmentName}</td>
                                    <td className="px-4 py-4 text-xs font-mono text-gray-500 flex flex-wrap gap-1 max-w-[200px]">
                                        {sh.items.slice(0, 2).map((it, i) => <span key={i} className="bg-gray-100 px-1.5 py-0.5 rounded">{it.product.skuCode}</span>)}
                                        {sh.items.length > 2 && <span className="bg-gray-100 px-1.5 py-0.5 rounded">+{sh.items.length - 2}</span>}
                                    </td>
                                    <td className="px-4 py-4 text-right font-medium text-emerald-600 tabular-nums">{sh.totalUnits.toLocaleString()}</td>
                                    <td className="px-4 py-4 font-medium text-gray-600">{formatDate(sh.shipDate)}</td>
                                    <td className="px-4 py-4 font-medium text-blue-600">{sh.destinationFc || "—"}</td>
                                    <td className="px-4 py-4 font-mono text-xs text-gray-500">{sh.trackingNumber || "—"}</td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>
                                            {st.label}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <Link href={`/fba/shipments/${sh.id}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium text-sm">
                                            <Eye size={16} /> Xem
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function KPICard({ title, value, subtitle, isAlert = false }: any) {
    return (
        <div className={`bg-white rounded-xl border p-5 ${isAlert ? "border-red-200 bg-red-50/20" : "border-gray-200 shadow-sm"}`}>
            <h3 className={`text-sm font-medium mb-1 ${isAlert ? "text-red-500" : "text-gray-500"}`}>{title}</h3>
            <p className={`text-2xl font-bold ${isAlert ? "text-red-600" : "text-gray-800"}`}>{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
    );
}
