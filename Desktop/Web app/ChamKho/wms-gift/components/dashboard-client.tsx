"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
    ArrowRight,
    RefreshCcw,
    DollarSign,
    Package,
    Factory,
    AlertTriangle,
    Truck,
    TrendingUp,
    Clock
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { WORK_ORDER_STATUS } from "@/lib/constants";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend,
    Line,
    ComposedChart,
    ResponsiveContainer,
    Cell
} from "recharts";

/* =========================================================================
   TYPES
   ========================================================================= */
interface StatsData {
    revenueToday: number;
    unitsToday: number;
    salesChangeStr: string;
    salesChangeIsUp: boolean;
    totalFbaUnits: number;
    totalFbaSkus: number;
    criticalSkus: number;
    activeWoCount: number;
    activeWoUnits: number;
    overdueWos: number;
    totalLowMats: number;
    firstLowMatName: string | null;
    incomingPoCount: number;
    daysToNearestPo: number;
    revenueThisMonth: number;
    monthChangeStr: string;
    revenueTargetProgress: number;
}

interface ActivityItem {
    id: string;
    type: string;
    title: string;
    timestamp: string;
    icon: string;
    color: string;
}

/* =========================================================================
   MAIN DASHBOARD COMPONENT
   ========================================================================= */
export default function DashboardClient() {
    const { data: stats, isLoading: statsLoading, refetch: refetchStats, dataUpdatedAt: statsUpdatedAt } = useQuery<StatsData>({
        queryKey: ["dashboard", "stats"],
        queryFn: () => fetch("/api/dashboard/stats").then(res => res.json())
    });

    const { data: charts, isLoading: chartsLoading, refetch: refetchCharts } = useQuery({
        queryKey: ["dashboard", "charts"],
        queryFn: () => fetch("/api/dashboard/charts").then(res => res.json())
    });

    const { data: activityRes, isLoading: activityLoading, refetch: refetchActivity } = useQuery({
        queryKey: ["dashboard", "activity"],
        queryFn: () => fetch("/api/dashboard/activity").then(res => res.json())
    });

    // WOs and Low Stock mini-tables will grab their data directly or we can reuse endpoints.
    // The user prompt says "Top 5 WO mới nhất chưa COMPLETED" and "Cảnh báo tồn kho sắp hết hàng".
    // We didn't create a specific mini-table API, but we can hit the existing standard APIs and clip the data 
    // on the frontend since it's an admin dashboard.
    const { data: wosRes, isLoading: wosLoading, refetch: refetchWos } = useQuery({
        queryKey: ["dashboard", "wos"],
        queryFn: () => fetch("/api/work-orders?status=IN_PROGRESS").then(res => res.json())
    });

    const { data: fbaRes, isLoading: fbaLoading, refetch: refetchFba } = useQuery({
        queryKey: ["dashboard", "fba"],
        queryFn: () => fetch("/api/fba/inventory").then(res => res.json())
    });

    const handleRefresh = () => {
        refetchStats();
        refetchCharts();
        refetchActivity();
        refetchWos();
        refetchFba();
    };

    // Helper for relative time
    const getRelativeTime = (dStr: string) => {
        const msPerMinute = 60 * 1000;
        const msPerHour = msPerMinute * 60;
        const msPerDay = msPerHour * 24;
        const elapsed = Date.now() - new Date(dStr).getTime();

        if (elapsed < msPerMinute) return "Vừa xong";
        if (elapsed < msPerHour) return `${Math.round(elapsed / msPerMinute)} phút trước`;
        if (elapsed < msPerDay) return `${Math.round(elapsed / msPerHour)} giờ trước`;
        return `${Math.round(elapsed / msPerDay)} ngày trước`;
    };

    const updateTimeStr = statsUpdatedAt ? new Date(statsUpdatedAt).toLocaleTimeString("vi-VN") : "—";

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Tổng quan Hệ thống (Dashboard)</h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>Cập nhật lúc: <strong className="text-gray-700">{updateTimeStr}</strong></span>
                    <button onClick={handleRefresh} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors" title="Làm mới dữ liệu">
                        <RefreshCcw size={16} />
                    </button>
                </div>
            </div>

            {/* ROW 1: 6 KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Card 1: Doanh số hôm nay */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Doanh số hôm nay</p>
                            {statsLoading ? <Skeleton className="h-8 w-32 mt-2" /> : (
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">${stats?.revenueToday.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0"><DollarSign size={20} /></div>
                    </div>
                    {statsLoading ? <Skeleton className="h-4 w-40 mt-4" /> : (
                        <div className="flex items-center gap-2 mt-4 text-sm">
                            <span className="font-medium text-gray-700">{stats?.unitsToday} units bán</span>
                            <span className="text-gray-300">|</span>
                            <span className={`font-semibold ${stats?.salesChangeIsUp ? "text-emerald-600" : "text-red-500"}`}>
                                {stats?.salesChangeStr} so với hôm qua
                            </span>
                        </div>
                    )}
                </div>

                {/* Card 2: Tồn kho FBA */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Tồn kho FBA</p>
                            {statsLoading ? <Skeleton className="h-8 w-24 mt-2" /> : (
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalFbaUnits.toLocaleString()}</h3>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><Package size={20} /></div>
                    </div>
                    {statsLoading ? <Skeleton className="h-4 w-48 mt-4" /> : (
                        <div className="flex items-center gap-2 mt-4 text-sm">
                            <span className="font-medium text-gray-700">{stats?.totalFbaSkus} SKU đang bán</span>
                            {stats!.criticalSkus > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                                    ⚠️ {stats?.criticalSkus} SKU sắp hết
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Card 3: Đang sản xuất */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Lệnh đang sản xuất</p>
                            {statsLoading ? <Skeleton className="h-8 w-16 mt-2" /> : (
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.activeWoCount}</h3>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0"><Factory size={20} /></div>
                    </div>
                    {statsLoading ? <Skeleton className="h-4 w-48 mt-4" /> : (
                        <div className="flex items-center gap-2 mt-4 text-sm">
                            <span className="font-medium text-gray-700">{stats?.activeWoUnits.toLocaleString()} units đang làm</span>
                            {stats!.overdueWos > 0 && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">
                                    {stats?.overdueWos} WO trễ hạn
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Card 4: Nguyên liệu cần nhập (Clickable) */}
                <Link href="/materials" className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-red-200 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium flex items-center gap-1.5 text-red-600">
                                Nguyên liệu cần nhập <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                            </p>
                            {statsLoading ? <Skeleton className="h-8 w-16 mt-2" /> : (
                                <h3 className="text-3xl font-bold text-red-700 mt-1">{stats?.totalLowMats}</h3>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0"><AlertTriangle size={20} /></div>
                    </div>
                    {statsLoading ? <Skeleton className="h-4 w-40 mt-4" /> : (
                        <div className="mt-4 text-sm">
                            {stats?.totalLowMats && stats.totalLowMats > 0 ? (
                                <span className="text-gray-600 truncate block">Thiếu: {stats.firstLowMatName} {stats.totalLowMats > 1 ? `và ${stats.totalLowMats - 1} loại khác` : ''}</span>
                            ) : (
                                <span className="text-emerald-600 font-medium">✅ Không có nguyên liệu thiếu</span>
                            )}
                        </div>
                    )}
                </Link>

                {/* Card 5: PO đang về */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Đơn PO đang về</p>
                            {statsLoading ? <Skeleton className="h-8 w-16 mt-2" /> : (
                                <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats?.incomingPoCount}</h3>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0"><Truck size={20} /></div>
                    </div>
                    {statsLoading ? <Skeleton className="h-4 w-48 mt-4" /> : (
                        <div className="mt-4 text-sm text-gray-600">
                            {stats?.incomingPoCount && stats.incomingPoCount > 0 ? (
                                <span>Dự kiến lô sớm nhất: <strong className="text-purple-700">{stats.daysToNearestPo >= 0 ? `trong ${stats.daysToNearestPo} ngày` : 'Đã quá hạn'}</strong></span>
                            ) : (
                                <span>Không có đơn hàng nào đang về</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Card 6: Doanh thu tháng này */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Doanh thu tháng này</p>
                            {statsLoading ? <Skeleton className="h-8 w-32 mt-2" /> : (
                                <h3 className="text-2xl font-bold text-gray-900 mt-1">${stats?.revenueThisMonth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0"><TrendingUp size={20} /></div>
                    </div>
                    {statsLoading ? <Skeleton className="h-4 w-48 mt-4" /> : (
                        <div className="mt-4 text-sm space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-500 font-medium text-xs">So với tháng trước: <span className={stats.revenueTargetProgress >= 100 ? "text-emerald-600" : "text-gray-700"}>{stats?.monthChangeStr}</span></span>
                                <span className="text-xs font-bold text-gray-700">{stats?.revenueTargetProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${stats.revenueTargetProgress >= 100 ? "bg-emerald-500" : "bg-orange-500"}`} style={{ width: `${Math.min(100, stats.revenueTargetProgress || 0)}%` }}></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ROW 2: CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm h-[360px] flex flex-col">
                    <div className="mb-4">
                        <h3 className="font-bold text-gray-800">Doanh số 30 ngày gần nhất</h3>
                        <p className="text-xs text-gray-500 mt-1">Lưu lượng Units (cột) và Revenue $ (đường)</p>
                    </div>
                    <div className="flex-1 min-h-0">
                        {chartsLoading ? <div className="w-full h-full flex items-center justify-center"><Skeleton className="w-full h-full" /></div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={charts?.salesChart || []} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="date" tickFormatter={d => d.substring(5, 10)} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#3b82f6" }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="right" orientation="right" tickFormatter={v => `$${v}`} tick={{ fontSize: 10, fill: "#f97316" }} axisLine={false} tickLine={false} />
                                    <RechartsTooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                                    <Bar yAxisId="left" dataKey="units" name="Units Sold" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={12} />
                                    <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#f97316" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm h-[360px] flex flex-col">
                    <div className="mb-4">
                        <h3 className="font-bold text-gray-800">Tồn kho FBA theo SKU</h3>
                        <p className="text-xs text-gray-500 mt-1">Hiển thị số ngày còn lại (Days of Supply)</p>
                    </div>
                    <div className="flex-1 min-h-0">
                        {chartsLoading ? <div className="w-full h-full flex items-center justify-center"><Skeleton className="w-full h-full" /></div> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart layout="vertical" data={charts?.stockChart || []} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="sku" type="category" tick={{ fontSize: 11, fill: "#4b5563" }} width={80} axisLine={false} tickLine={false} />
                                    <RechartsTooltip cursor={{ fill: "#f9fafb" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                                    <Bar dataKey="daysOfSupply" name="Days of Supply" radius={[0, 4, 4, 0]} barSize={16}>
                                        {(charts?.stockChart || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>
            </div>

            {/* ROW 3: TABLES */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Work Orders Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Factory size={16} className="text-indigo-500" /> Work Orders đang chạy</h3>
                        <Link href="/production" className="text-xs font-semibold text-blue-600 hover:underline">Xem tất cả &rarr;</Link>
                    </div>
                    <div className="p-0 overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-2 font-medium">SKU</th>
                                    <th className="px-4 py-2 font-medium text-right">Số lượng</th>
                                    <th className="px-4 py-2 font-medium">Tiến độ</th>
                                    <th className="px-4 py-2 font-medium">Ngày kết thúc</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {wosLoading ? <tr><td colSpan={4} className="p-4"><Skeleton className="h-10 w-full" /></td></tr> :
                                    wosRes?.workOrders?.slice(0, 5).map((wo: any) => {
                                        const pct = (wo.quantityCompleted / wo.quantityPlanned) * 100 || 0;
                                        const isOverdue = wo.plannedEnd && new Date(wo.plannedEnd).getTime() < Date.now();
                                        return (
                                            <tr key={wo.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 font-medium text-gray-800">{wo.product.skuCode}</td>
                                                <td className="px-4 py-3 text-right font-medium text-indigo-600">{wo.quantityPlanned}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }}></div></div>
                                                        <span className="text-xs font-medium text-gray-500 w-8 text-right">{Math.round(pct)}%</span>
                                                    </div>
                                                </td>
                                                <td className={`px-4 py-3 text-xs font-medium ${isOverdue ? "text-red-500" : "text-gray-600"}`}>
                                                    {formatDate(wo.plannedEnd)}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                {!wosLoading && (!wosRes?.workOrders || wosRes.workOrders.length === 0) && (
                                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400">Không có lệnh sản xuất nào đang chạy</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* FBA Low Stock Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Cảnh báo tồn kho FBA (&lt; 30d)</h3>
                        <Link href="/fba" className="text-xs font-semibold text-blue-600 hover:underline">Xem tất cả &rarr;</Link>
                    </div>
                    <div className="p-0 overflow-x-auto flex-1">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-500 bg-white border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-2 font-medium">Sản phẩm</th>
                                    <th className="px-4 py-2 font-medium text-right">Còn (FC)</th>
                                    <th className="px-4 py-2 font-medium text-right">Velocity</th>
                                    <th className="px-4 py-2 font-medium">Cảnh báo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {fbaLoading ? <tr><td colSpan={4} className="p-4"><Skeleton className="h-10 w-full" /></td></tr> :
                                    fbaRes?.inventory?.filter((inv: any) => inv.velocity7d > 0 && (inv.fulfillableQty / inv.velocity7d) < 30)
                                        .sort((a: any, b: any) => (a.fulfillableQty / a.velocity7d) - (b.fulfillableQty / b.velocity7d))
                                        .slice(0, 5)
                                        .map((inv: any) => {
                                            const days = Math.floor(inv.fulfillableQty / inv.velocity7d);
                                            const isCrit = days < 14;
                                            return (
                                                <tr key={inv.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium text-gray-800 block truncate max-w-[150px]" title={inv.product.productName}>{inv.product.productName}</span>
                                                        <span className="text-xs text-gray-400 font-mono">{inv.product.skuCode}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-800">{inv.fulfillableQty.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right text-gray-500">{inv.velocity7d.toFixed(1)}/d</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${isCrit ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                            Sau {days} ngày
                                                        </span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                {!fbaLoading && (!fbaRes?.inventory || fbaRes.inventory.filter((inv: any) => inv.velocity7d > 0 && (inv.fulfillableQty / inv.velocity7d) < 30).length === 0) && (
                                    <tr><td colSpan={4} className="px-4 py-6 text-center text-emerald-500 font-medium">✅ Tất cả FBA Stock đều ở mức an toàn</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ROW 4: ACTIVITY FEED */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={16} className="text-gray-500" /> Hoạt động mới nhất</h3>
                </div>
                <div className="p-6">
                    {activityLoading ? <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div> : (
                        <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                            {activityRes?.activity?.length > 0 ? activityRes.activity.map((act: ActivityItem, idx: number) => (
                                <div key={act.id} className="relative pl-6">
                                    {/* Dot */}
                                    <span className={`absolute -left-[14px] top-1 flex items-center justify-center w-7 h-7 rounded-full text-base shadow-sm ring-4 ring-white ${act.color}`}>
                                        {act.icon}
                                    </span>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                        <p className="text-sm font-medium text-gray-800">{act.title}</p>
                                        <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded shrink-0">
                                            {getRelativeTime(act.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-gray-400 p-4">Chưa có hoạt động nào gần đây.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
