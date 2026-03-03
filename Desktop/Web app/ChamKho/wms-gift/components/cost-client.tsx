"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import {
    BarChart, PieChart, Info, Download,
    DollarSign, ArrowUpRight, ArrowDownRight, Edit2, Check
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CostClient() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<"sku" | "pl" | "cashflow">("sku");

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Chi phí & P&L</h1>
                    <p className="text-gray-500 mt-1">Phân tích giá thành, hiệu quả kinh doanh và dự báo dòng tiền</p>
                </div>
            </div>

            <div className="flex space-x-1 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab("sku")}
                    className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "sku" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                >
                    Chi phí theo SKU
                </button>
                <button
                    onClick={() => setActiveTab("pl")}
                    className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "pl" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                >
                    P&L Theo tháng
                </button>
                <button
                    onClick={() => setActiveTab("cashflow")}
                    className={`py-2 px-4 font-medium text-sm border-b-2 transition-colors ${activeTab === "cashflow" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
                >
                    Dòng tiền (Cash flow)
                </button>
            </div>

            {activeTab === "sku" && <SKUCostTab />}
            {activeTab === "pl" && <PLTab />}
            {activeTab === "cashflow" && <CashFlowTab />}
        </div>
    );
}

function SKUCostTab() {
    const queryClient = useQueryClient();
    const [selectedSkuId, setSelectedSkuId] = useState("");

    const { data: products } = useQuery({
        queryKey: ["products-list"],
        queryFn: () => fetch("/api/inventory/products").then(res => res.json())
    });

    const { data: skuCost, isLoading } = useQuery({
        queryKey: ["cost-sku", selectedSkuId],
        queryFn: () => fetch(`/api/costs/sku/${selectedSkuId}`).then(res => res.json()),
        enabled: !!selectedSkuId
    });

    const mutation = useMutation({
        mutationFn: (updatedFields: any) =>
            fetch(`/api/costs/sku/${selectedSkuId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedFields)
            }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cost-sku", selectedSkuId] })
    });

    const [editMode, setEditMode] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<any>({});

    const handleEdit = (field: string, value: string) => {
        setEditMode(field);
        setEditValues({ [field]: value });
    };

    const handleSave = (field: string) => {
        const payload = {
            fbaFulfillment: skuCost?.product?.fbaFulfillment,
            fbaStorage: skuCost?.product?.fbaStorage,
            amazonReferralPct: skuCost?.product?.amazonReferralPct,
            ...editValues
        };
        // Format numeric values
        Object.keys(payload).forEach(k => payload[k] = Number(payload[k]));
        mutation.mutate(payload);
        setEditMode(null);
    };

    const renderGauge = (marginPct: number) => {
        let color = "text-emerald-500";
        let bg = "text-emerald-100";
        if (marginPct < 15) { color = "text-rose-500"; bg = "text-rose-100"; }
        else if (marginPct < 30) { color = "text-amber-500"; bg = "text-amber-100"; }

        return (
            <div className="relative w-28 h-28 flex items-center justify-center mx-auto">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className={bg} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className={color} strokeDasharray={`${Math.max(0, Math.min(marginPct, 100))}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                </svg>
                <div className="absolute text-center">
                    <span className="text-xl font-bold text-gray-800">{marginPct.toFixed(1)}%</span>
                </div>
            </div>
        );
    };

    const productList = products?.products || [];

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                <label className="font-medium text-gray-700 shrink-0">Chọn SKU phân tích:</label>
                <select
                    className="w-full max-w-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    value={selectedSkuId}
                    onChange={(e) => setSelectedSkuId(e.target.value)}
                >
                    <option value="">-- Vui lòng chọn SKU --</option>
                    {productList.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.skuCode} - {p.productName}</option>
                    ))}
                </select>
            </div>

            {isLoading && <Skeleton className="w-full h-64" />}

            {skuCost && skuCost.product && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                            <h3 className="font-bold text-gray-800">BREAKDOWN CHI PHÍ / UNIT</h3>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 bg-gray-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-3 font-medium">Loại chi phí</th>
                                    <th className="px-6 py-3 font-medium">Cách tính</th>
                                    <th className="px-6 py-3 font-medium text-right">Chi phí/unit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 flex items-center gap-2"><span className="text-lg">🧱</span> <span className="font-medium text-gray-900">Nguyên liệu</span></td>
                                    <td className="px-6 py-4 text-gray-500">BOM × avg_unit_cost</td>
                                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(skuCost.breakdown.rawMaterial)}</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 flex items-center gap-2"><span className="text-lg">👷</span> <span className="font-medium text-gray-900">Nhân công</span></td>
                                    <td className="px-6 py-4 text-gray-500">Attendance tháng này ÷ Units</td>
                                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(skuCost.breakdown.labor)}</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 flex items-center gap-2"><span className="text-lg">📦</span> <span className="font-medium text-gray-900">Đóng gói</span></td>
                                    <td className="px-6 py-4 text-gray-500">Material category = packaging</td>
                                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(skuCost.breakdown.packaging)}</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 flex items-center gap-2"><span className="text-lg">✈️</span> <span className="font-medium text-gray-900">Ship đến Amazon</span></td>
                                    <td className="px-6 py-4 text-gray-500">Shipping_cost ÷ Units (TB)</td>
                                    <td className="px-6 py-4 text-right font-medium">${skuCost.breakdown.shipping.toFixed(2)}</td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 flex items-center gap-2"><span className="text-lg">🏭</span> <span className="font-medium text-gray-900">FBA Fulfillment</span></td>
                                    <td className="px-6 py-4 text-gray-500">Manual input</td>
                                    <td className="px-6 py-4 text-right">
                                        {editMode === 'fbaFulfillment' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <input type="number" step="0.01" className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right" autoFocus value={editValues.fbaFulfillment} onChange={(e) => setEditValues({ fbaFulfillment: e.target.value })} />
                                                <button onClick={() => handleSave('fbaFulfillment')} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded"><Check size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => handleEdit('fbaFulfillment', skuCost.product.fbaFulfillment)}>
                                                <span className="font-medium text-blue-700">${Number(skuCost.product.fbaFulfillment).toFixed(2)}</span>
                                                <Edit2 size={14} className="text-gray-400 group-hover:text-blue-600 hidden group-hover:block" />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 flex items-center gap-2"><span className="text-lg">🏪</span> <span className="font-medium text-gray-900">FBA Storage</span></td>
                                    <td className="px-6 py-4 text-gray-500">Manual input ước tính</td>
                                    <td className="px-6 py-4 text-right">
                                        {editMode === 'fbaStorage' ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <input type="number" step="0.01" className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-right" autoFocus value={editValues.fbaStorage} onChange={(e) => setEditValues({ fbaStorage: e.target.value })} />
                                                <button onClick={() => handleSave('fbaStorage')} className="text-emerald-600 p-1 hover:bg-emerald-50 rounded"><Check size={16} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2 group cursor-pointer" onClick={() => handleEdit('fbaStorage', skuCost.product.fbaStorage)}>
                                                <span className="font-medium text-blue-700">${Number(skuCost.product.fbaStorage).toFixed(2)}</span>
                                                <Edit2 size={14} className="text-gray-400 group-hover:text-blue-600 hidden group-hover:block" />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                                <tr className="hover:bg-gray-50">
                                    <td className="px-6 py-4 flex items-center gap-2"><span className="text-lg">💸</span> <span className="font-medium text-gray-900">Amazon Referral</span></td>
                                    <td className="px-6 py-4 text-gray-500">
                                        {editMode === 'amazonReferralPct' ? (
                                            <div className="flex items-center gap-2 inline-flex">
                                                <input type="number" step="0.1" className="w-16 border border-gray-300 rounded px-2 py-0.5 text-xs" autoFocus value={editValues.amazonReferralPct} onChange={(e) => setEditValues({ amazonReferralPct: e.target.value })} />
                                                <span className="text-xs">% × selling_price</span>
                                                <button onClick={() => handleSave('amazonReferralPct')} className="text-emerald-600 p-0.5 hover:bg-emerald-50 rounded"><Check size={14} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 group cursor-pointer inline-flex" onClick={() => handleEdit('amazonReferralPct', skuCost.product.amazonReferralPct)}>
                                                <span className="underline decoration-dashed decoration-gray-400 hover:text-blue-600">{skuCost.product.amazonReferralPct}%</span> × selling_price
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-rose-600">${skuCost.breakdown.amazonReferral.toFixed(2)}</td>
                                </tr>
                                <tr className="bg-gray-100/80 font-bold border-t-2 border-gray-200">
                                    <td colSpan={2} className="px-6 py-4 text-right text-gray-800">TỔNG COGS / UNIT (Quy đổi ALL to $)</td>
                                    <td className="px-6 py-4 text-right text-rose-600">${(skuCost.summary.totalCogs / 25000 + skuCost.breakdown.shipping + skuCost.product.fbaFulfillment + skuCost.product.fbaStorage + skuCost.breakdown.amazonReferral).toFixed(2)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col items-center">
                        <h3 className="font-bold text-gray-800 self-start mb-6">SUMMARY LỢI NHUẬN</h3>

                        <div className="flex flex-col w-full gap-4 text-center mb-8">
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                <p className="text-sm text-gray-500 mb-1">Giá Bán Báo Cáo</p>
                                <p className="text-3xl font-bold text-gray-900">${skuCost.product.sellingPrice.toFixed(2)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-rose-50 rounded-lg p-3 border border-rose-100 text-center">
                                    <p className="text-xs text-rose-600 font-medium mb-1">Tổng COGS</p>
                                    <p className="text-lg font-bold text-rose-700">${(skuCost.product.sellingPrice - (skuCost.summary.grossProfit)).toFixed(2)}</p>
                                </div>
                                <div className={`${skuCost.summary.grossProfit > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} rounded-lg p-3 border text-center`}>
                                    <p className={`text-xs ${skuCost.summary.grossProfit > 0 ? 'text-emerald-600' : 'text-rose-600'} font-medium mb-1`}>Lợi nhuận gộp</p>
                                    <p className={`text-lg font-bold ${skuCost.summary.grossProfit > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>${skuCost.summary.grossProfit.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500 text-center mb-4">Gross Margin %</p>
                            {renderGauge(skuCost.summary.margin)}
                        </div>
                    </div>
                </div>
            )}

            {selectedSkuId && !skuCost && !isLoading && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-200">Lỗi không thể tải dữ liệu SKU.</div>
            )}
        </div>
    );
}

function PLTab() {
    const currentDate = new Date();
    const defaultMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
    const [month, setMonth] = useState(defaultMonth);

    const { data: plData, isLoading } = useQuery({
        queryKey: ["pl", month],
        queryFn: () => fetch(`/api/costs/pl?month=${month}`).then(res => res.json())
    });

    const handleExport = () => {
        window.location.href = `/api/costs/pl/export?month=${month}`;
    };

    const data = plData?.data || [];

    const sumRev = data.reduce((s: number, i: any) => s + i.revenue, 0);
    const sumCogs = data.reduce((s: number, i: any) => s + i.cogs, 0);
    const sumFba = data.reduce((s: number, i: any) => s + i.fbaFees, 0);
    const sumNet = data.reduce((s: number, i: any) => s + i.netProfit, 0);
    const sumMargin = sumRev > 0 ? (sumNet / sumRev) * 100 : 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <input
                        type="month"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                    />
                    <div className="text-sm text-gray-500 hidden sm:block">So sánh với: <span className="font-medium text-gray-700 cursor-pointer hover:underline">Tháng trước</span> | <span className="font-medium text-gray-700 cursor-pointer hover:underline">Cùng kỳ năm ngoái</span></div>
                </div>
                <button onClick={handleExport} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
                    <Download size={16} /> Xuất Excel
                </button>
            </div>

            {/* CHARTS ROW (Visual Placeholders) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64">
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-center items-center text-gray-400">
                    <BarChart size={48} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">Bar chart: Revenue vs COGS vs Net Profit</p>
                    <p className="text-xs text-gray-400">(Sử dụng thư viện Recharts để render thực tế)</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col justify-center items-center text-gray-400">
                    <PieChart size={48} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">Pie chart: Tỷ trọng doanh thu theo SKU</p>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200 uppercase">
                            <tr>
                                <th className="px-4 py-3 font-medium">SKU</th>
                                <th className="px-4 py-3 font-medium">Tên SP</th>
                                <th className="px-4 py-3 font-medium text-center">Units Bán</th>
                                <th className="px-4 py-3 font-medium text-right text-blue-800 bg-blue-50/50">Revenue</th>
                                <th className="px-4 py-3 font-medium text-right text-rose-800 bg-rose-50/50">COGS</th>
                                <th className="px-4 py-3 font-medium text-right font-bold text-gray-800">Gross Profit</th>
                                <th className="px-4 py-3 font-medium text-right text-amber-800 bg-amber-50/50">FBA Fees</th>
                                <th className="px-4 py-3 font-medium text-right font-bold text-emerald-800">Net Profit</th>
                                <th className="px-4 py-3 font-medium text-center">Margin %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan={9} className="p-4"><Skeleton className="h-32 w-full" /></td></tr>
                            ) : data.length > 0 ? (
                                <>
                                    {data.map((item: any) => {
                                        let marginColor = "text-emerald-600 bg-emerald-50";
                                        if (item.margin < 15) marginColor = "text-rose-600 bg-rose-50";
                                        else if (item.margin < 30) marginColor = "text-amber-600 bg-amber-50";

                                        return (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900">{item.skuCode}</td>
                                                <td className="px-4 py-3 text-gray-600 truncate max-w-[200px]" title={item.productName}>{item.productName}</td>
                                                <td className="px-4 py-3 text-center">{item.unitsSold}</td>
                                                <td className="px-4 py-3 text-right bg-blue-50/20">${item.revenue.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right bg-rose-50/20">${item.cogs.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-bold">${item.grossProfit.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right bg-amber-50/20">${item.fbaFees.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-right font-bold">${item.netProfit.toFixed(2)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-block px-2 py-1 rounded font-bold text-xs ${marginColor}`}>
                                                        {item.margin.toFixed(1)}%
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {/* THÊM DÒNG TỔNG */}
                                    <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                                        <td colSpan={3} className="px-4 py-4 text-gray-800">TỔNG CỘNG THÁNG {month}</td>
                                        <td className="px-4 py-4 text-right text-blue-900">${sumRev.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-right text-rose-900">${sumCogs.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-right text-gray-900">${(sumRev - sumCogs).toFixed(2)}</td>
                                        <td className="px-4 py-4 text-right text-amber-900">${sumFba.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-right text-emerald-900">${sumNet.toFixed(2)}</td>
                                        <td className="px-4 py-4 text-center text-lg text-emerald-700">{sumMargin.toFixed(1)}%</td>
                                    </tr>
                                </>
                            ) : (
                                <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Không có dữ liệu P&L cho tháng này.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function CashFlowTab() {
    const { data, isLoading } = useQuery({
        queryKey: ["cashflow"],
        queryFn: () => fetch("/api/costs/cashflow").then(res => res.json())
    });

    if (isLoading) return <Skeleton className="h-64 w-full" />;

    const { summary, items } = data;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800">Dự báo thanh toán 90 ngày tới</h2>

            {/* TIMELINE */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border-l-4 border-rose-500 rounded-r-xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">🔴 Trong 30 ngày tới</p>
                    <h3 className={`text-3xl font-bold ${summary.total30 > 50000000 ? 'text-rose-600' : 'text-gray-900'}`}>{formatCurrency(summary.total30)}</h3>
                </div>
                <div className="bg-white border-l-4 border-amber-400 rounded-r-xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">🟡 31 - 60 ngày</p>
                    <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(summary.total31_60)}</h3>
                </div>
                <div className="bg-white border-l-4 border-emerald-500 rounded-r-xl p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">🟢 61 - 90 ngày</p>
                    <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(summary.total61_90)}</h3>
                </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex justify-between items-center shadow-inner">
                <span className="font-bold text-gray-700 uppercase tracking-widest text-sm">Tổng cần thanh toán 90 ngày:</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(summary.total90)}</span>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium">Trạng thái</th>
                                <th className="px-6 py-3 font-medium">PO Số</th>
                                <th className="px-6 py-3 font-medium">Nhà cung cấp</th>
                                <th className="px-6 py-3 font-medium text-right">Tổng PO</th>
                                <th className="px-6 py-3 font-medium text-right">Đã trả</th>
                                <th className="px-6 py-3 font-medium text-right">Còn lại</th>
                                <th className="px-6 py-3 font-medium">Hạn thanh toán</th>
                                <th className="px-6 py-3 font-medium text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {items.length > 0 ? (
                                items.map((po: any) => {
                                    let statusBadge = "";
                                    let bgRow = "hover:bg-gray-50";

                                    if (po.daysUntilDue < 0) {
                                        statusBadge = "🔴 Đã quá hạn";
                                        bgRow = "bg-rose-50/30 hover:bg-rose-50/50";
                                    } else if (po.daysUntilDue <= 7) {
                                        statusBadge = "🟡 Sắp đến hạn";
                                        bgRow = "bg-amber-50/30 hover:bg-amber-50/50";
                                    } else {
                                        statusBadge = "🟢 Chưa đến hạn";
                                    }

                                    return (
                                        <tr key={po.id} className={bgRow}>
                                            <td className="px-6 py-4 font-bold text-xs">{statusBadge}</td>
                                            <td className="px-6 py-4 font-mono text-gray-600">{po.poNumber}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{po.supplierName}</td>
                                            <td className="px-6 py-4 text-right">{formatCurrency(po.totalAmount)}</td>
                                            <td className="px-6 py-4 text-right text-gray-500">{formatCurrency(po.paidAmount)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-rose-600">{formatCurrency(po.remainingAmount)}</td>
                                            <td className="px-6 py-4 text-gray-600">
                                                {new Date(po.dueDate).toLocaleDateString("vi-VN")}
                                                <span className="text-xs text-gray-400 ml-1">({po.daysUntilDue} ngày)</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button className="text-xs bg-white border border-gray-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-gray-700 px-3 py-1.5 rounded transition-colors shadow-sm">
                                                    Đánh dấu đã thanh toán
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })
                            ) : (
                                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Khống có PO nào cần thanh toán.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
