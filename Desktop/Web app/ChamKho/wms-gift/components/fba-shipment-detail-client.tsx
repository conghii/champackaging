"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Clock, Loader2, Package, Truck } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";
import { FBA_SHIPMENT_STATUS, type FBAShipmentStatusKey } from "@/lib/constants";

const FLOW = [
    "PLANNING", "LABELING", "READY_TO_SHIP", "SHIPPED",
    "IN_TRANSIT", "DELIVERED", "RECEIVING", "LIVE", "CLOSED"
];

export default function FBAShipmentDetailClient({ id }: { id: string }) {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // States for modals
    const [showShipModal, setShowShipModal] = useState(false);
    const [showReceiveModal, setShowReceiveModal] = useState(false);

    // Transition actions
    const [savingAction, setSavingAction] = useState(false);

    const fetchShipment = useCallback(async () => {
        try {
            const res = await fetch(`/api/fba/shipments/${id}`);
            if (!res.ok) {
                if (res.status === 404) router.push("/fba");
                return;
            }
            const d = await res.json();
            setData(d.shipment);
        } catch {
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => { fetchShipment() }, [fetchShipment]);

    if (loading) return <div className="p-10 text-center text-gray-400">Đang tải...</div>;
    if (!data) return null;

    const currentStatusIdx = FLOW.indexOf(data.status);
    const statusObj = FBA_SHIPMENT_STATUS[data.status as FBAShipmentStatusKey] || { label: data.status, color: "bg-gray-100 text-gray-600" };

    const handleSimpleTransition = async (targetStatus: string) => {
        setSavingAction(true);
        try {
            const res = await fetch(`/api/fba/shipments/${id}/transition`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetStatus })
            });
            if (!res.ok) throw new Error((await res.json()).error);
            await fetchShipment();
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSavingAction(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <button onClick={() => router.push("/fba")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft size={16} /> Quay lại Quản lý FBA
            </button>

            {/* HEADER SECTION */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl font-bold text-gray-800">{data.shipmentName}</h1>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${statusObj.color}`}>
                            {statusObj.label}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                        <span>FC Đến: <strong className="text-gray-800">{data.destinationFc || "—"}</strong></span>
                        <span>Ngày Ship: <strong className="text-gray-800">{formatDate(data.shipDate)}</strong></span>
                        <span>Chi phí: <strong className="text-gray-800">${Number(data.shippingCost).toFixed(2)}</strong></span>
                        <span>Tracking: <strong className="text-gray-800 font-mono">{data.trackingNumber || "—"}</strong></span>
                    </div>
                </div>
                <div>
                    <ActionButtons
                        status={data.status}
                        onSimple={handleSimpleTransition}
                        onShip={() => setShowShipModal(true)}
                        onReceive={() => setShowReceiveModal(true)}
                        saving={savingAction}
                    />
                </div>
            </div>

            {/* TIMELINE */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 overflow-x-auto">
                <div className="flex justify-between items-center min-w-[800px]">
                    {FLOW.map((fStep, index) => {
                        const isCompleted = index < currentStatusIdx;
                        const isCurrent = index === currentStatusIdx;
                        const lbl = FBA_SHIPMENT_STATUS[fStep as FBAShipmentStatusKey]?.label || fStep;

                        return (
                            <div key={fStep} className="flex flex-col items-center relative w-full first:items-start last:items-end group">
                                {/* Line connecting nodes */}
                                {index < FLOW.length - 1 && (
                                    <div className={`absolute top-4 left-1/2 w-full h-[3px] -translate-y-1/2 ${index < currentStatusIdx ? "bg-emerald-500" : "bg-gray-200"
                                        }`} style={{ width: index === 0 ? "200%" : index === FLOW.length - 2 ? "200%" : "100%", right: index === FLOW.length - 2 ? "50%" : "auto" }} />
                                )}
                                {/* Node icon */}
                                <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 transition-all duration-300 ${isCompleted ? "border-emerald-500 text-emerald-500" :
                                        isCurrent ? "border-blue-600 bg-blue-50 text-blue-600 ring-4 ring-blue-100" :
                                            "border-gray-300 text-gray-300"
                                    }`}>
                                    {isCompleted ? <CheckCircle2 size={18} /> :
                                        isCurrent && (fStep === "IN_TRANSIT" || fStep === "SHIPPED") ? <Truck size={16} /> :
                                            isCurrent ? <Loader2 size={16} className="animate-spin" /> :
                                                <Circle size={12} />}
                                </div>
                                {/* Label */}
                                <span className={`mt-3 text-xs font-semibold whitespace-nowrap ${isCompleted ? "text-emerald-700" :
                                        isCurrent ? "text-blue-700" : "text-gray-400"
                                    }`}>{lbl}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ITEMS TABLE */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2"><Package size={18} className="text-blue-600" /> Sản phẩm trong lô</h3>
                    <span className="text-sm font-bold text-gray-600">Tổng cộng: <span className="text-blue-600 text-lg">{data.totalUnits}</span> units</span>
                </div>
                <table className="w-full text-sm text-left">
                    <thead className="bg-white border-b border-gray-100 text-gray-500">
                        <tr>
                            <th className="px-6 py-3 font-semibold">Sản phẩm</th>
                            <th className="px-6 py-3 font-semibold">SKU / FNSKU</th>
                            <th className="px-6 py-3 font-semibold text-right">Số lượng gửi</th>
                            <th className="px-6 py-3 font-semibold">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {data.items.map((it: any) => (
                            <tr key={it.id} className="hover:bg-gray-50/50">
                                <td className="px-6 py-4 font-medium text-gray-800">{it.product.productName}</td>
                                <td className="px-6 py-4">
                                    <span className="block font-mono text-gray-800">{it.product.skuCode}</span>
                                    <span className="block font-mono text-xs text-blue-600">{it.product.amazonFnsku || "—"}</span>
                                </td>
                                <td className="px-6 py-4 text-right tabular-nums text-emerald-600 font-bold">{it.quantity.toLocaleString()}</td>
                                <td className="px-6 py-4 text-gray-500 italic">{it.notes || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showShipModal && <ShipModal shipment={data} onClose={() => setShowShipModal(false)} onSaved={fetchShipment} />}
            {showReceiveModal && <ReceiveModal shipment={data} onClose={() => setShowReceiveModal(false)} onSaved={fetchShipment} />}
        </div>
    )
}

function ActionButtons({ status, onSimple, onShip, onReceive, saving }: any) {
    if (saving) return <span className="px-4 py-2 text-sm text-gray-400 font-medium animate-pulse">Đang cập nhật...</span>;

    switch (status) {
        case "PLANNING":
            return <button onClick={() => onSimple("LABELING")} className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg shadow-sm w-full md:w-auto">🏷️ Bắt đầu in nhãn</button>;
        case "LABELING":
            return <button onClick={() => onSimple("READY_TO_SHIP")} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm w-full md:w-auto">📦 Đóng gói xong</button>;
        case "READY_TO_SHIP":
            return <button onClick={onShip} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm w-full md:w-auto">🚚 Đã giao carrier</button>;
        case "SHIPPED":
            return <button onClick={() => onSimple("IN_TRANSIT")} className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-sm w-full md:w-auto">📍 Đang vận chuyển</button>;
        case "IN_TRANSIT":
            return <button onClick={() => onSimple("DELIVERED")} className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm w-full md:w-auto">🏭 Amazon đã nhận</button>;
        case "DELIVERED":
            return <button onClick={() => onSimple("RECEIVING")} className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm w-full md:w-auto">⏳ Amazon đang check-in</button>;
        case "RECEIVING":
            return <button onClick={onReceive} className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-sm w-full md:w-auto">✅ Hàng đã live</button>;
        case "LIVE":
            return <button onClick={() => onSimple("CLOSED")} className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-bold rounded-lg shadow-sm w-full md:w-auto">🔒 Đóng lô hàng</button>;
        default:
            return null;
    }
}

// ----------------------------------------------------
// MODALS
// ----------------------------------------------------

function ShipModal({ shipment, onClose, onSaved }: any) {
    const [tracking, setTracking] = useState(shipment.trackingNumber || "");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [cost, setCost] = useState(shipment.shippingCost || "0");
    const [saving, setSaving] = useState(false);

    const onSubmit = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/fba/shipments/${shipment.id}/transition`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetStatus: "SHIPPED", trackingNumber: tracking, shipDate: date, shippingCost: cost })
            });
            if (!res.ok) throw new Error("Lỗi cập nhật");
            onSaved();
            onClose();
        } catch {
            alert("Có lỗi xảy ra");
        } finally { setSaving(false) }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
                <h2 className="text-xl font-bold text-gray-800">Xác nhận giao Carrier (Shipped)</h2>
                <p className="text-sm text-gray-500">Cập nhật thông tin vận chuyển cho lô <b>{shipment.shipmentName}</b></p>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
                    <input type="text" value={tracking} onChange={e => setTracking(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày Ship thực tế</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí thực tế ($)</label>
                    <input type="number" step="0.01" value={cost} onChange={e => setCost(e.target.value)} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Hủy</button>
                    <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">{saving ? "Đang lưu..." : "Lưu & Xác nhận"}</button>
                </div>
            </form>
        </div>
    )
}

function ReceiveModal({ shipment, onClose, onSaved }: any) {
    // Maps productId -> receivedQty
    const [map, setMap] = useState<Record<string, number>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Initialize map with shipped quantities
        const initMap: Record<string, number> = {};
        shipment.items.forEach((it: any) => initMap[it.productId] = it.quantity);
        setMap(initMap);
    }, [shipment]);

    const onSubmit = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/fba/shipments/${shipment.id}/transition`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetStatus: "LIVE", receivedUnitsMap: map })
            });
            if (!res.ok) throw new Error("Lỗi cập nhật");
            onSaved();
            onClose();
        } catch {
            alert("Có lỗi xảy ra");
        } finally { setSaving(false) }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <form onSubmit={onSubmit} className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-green-700">Xác nhận Amazon Check-in (Hàng Live)</h2>
                <p className="text-sm text-gray-600">
                    Nhập số lượng thực tế mà Amazon đã ghi nhận (received).
                    Hệ thống sẽ tự động chuyển từ <strong className="text-gray-800">Inbound Qty</strong> sang <strong className="text-emerald-600">Fulfillable Qty</strong> trong kho.
                </p>

                <div className="border border-gray-200 rounded-lg overflow-hidden mt-4">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-2">Sản phẩm</th>
                                <th className="px-4 py-2 text-center">Số lượng Gửi đi</th>
                                <th className="px-4 py-2 text-right">Thực nhận (Amazon báo)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {shipment.items.map((it: any) => (
                                <tr key={it.id}>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-800">{it.product.productName}</div>
                                        <div className="text-xs text-gray-500 font-mono">{it.product.skuCode}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-600 font-bold">{it.quantity}</td>
                                    <td className="px-4 py-3 text-right">
                                        <input
                                            type="number" min="0"
                                            value={map[it.productId] ?? it.quantity}
                                            onChange={e => setMap({ ...map, [it.productId]: Number(e.target.value) })}
                                            className="w-24 px-3 py-1.5 border border-green-300 rounded focus:ring-2 focus:ring-green-500 bg-green-50 text-green-800 font-bold text-right"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">Hủy</button>
                    <button type="submit" disabled={saving} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold">{saving ? "Đang xử lý..." : "Hoàn thành Update Tồn kho"}</button>
                </div>
            </form>
        </div>
    )
}
