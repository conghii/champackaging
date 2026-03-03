"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, X } from "lucide-react";
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

interface Material {
    materialCode: string;
    materialName: string;
    unit: string;
}

interface POItem {
    id: string;
    materialId: string;
    quantity: string | number;
    unitPrice: string | number;
    receivedQty: string | number;
    material: Material;
}

interface Supplier {
    supplierCode: string;
    supplierName: string;
    country: string;
    contactPerson: string | null;
}

interface PO {
    id: string;
    poNumber: string;
    status: string;
    paymentStatus: string;
    totalAmount: string | number;
    currency: string;
    expectedDelivery: string | null;
    shippingMethod: string | null;
    notes: string | null;
    createdAt: string;
    supplier: Supplier;
    items: POItem[];
}

/* ================================================================
   TIMELINE STEPS
   ================================================================ */

const TIMELINE_STEPS = [
    "DRAFT",
    "SENT",
    "CONFIRMED",
    "IN_TRANSIT",
    "RECEIVED",
    "CLOSED",
];

const TIMELINE_LABELS: Record<string, string> = {
    DRAFT: "Nháp",
    SENT: "Đã gửi",
    CONFIRMED: "Xác nhận",
    IN_TRANSIT: "Vận chuyển",
    RECEIVED: "Đã nhận",
    CLOSED: "Đã đóng",
};

/* ================================================================
   ACTION BUTTONS CONFIG
   ================================================================ */

const ACTIONS: Record<string, { label: string; icon: string; target: string } | null> =
{
    DRAFT: { label: "📤 Gửi cho Supplier", icon: "📤", target: "SENT" },
    SENT: { label: "✅ Supplier xác nhận", icon: "✅", target: "CONFIRMED" },
    CONFIRMED: { label: "🚚 Đánh dấu đang ship", icon: "🚚", target: "IN_TRANSIT" },
    IN_TRANSIT: null, // handled by receive modal
    PARTIALLY_RECEIVED: null, // handled by receive modal
    RECEIVED: { label: "🔒 Đóng PO", icon: "🔒", target: "CLOSED" },
    CLOSED: null,
    CANCELLED: null,
};

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export default function PODetailClient() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [po, setPO] = useState<PO | null>(null);
    const [loading, setLoading] = useState(true);
    const [transitioning, setTransitioning] = useState(false);
    const [showReceive, setShowReceive] = useState(false);

    const fetchPO = useCallback(async () => {
        try {
            const res = await fetch(`/api/purchase-orders/${id}`);
            const data = await res.json();
            setPO(data.po);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchPO();
    }, [fetchPO]);

    const handleTransition = async (targetStatus: string) => {
        if (!po) return;
        setTransitioning(true);
        try {
            const res = await fetch(`/api/purchase-orders/${po.id}/transition`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetStatus }),
            });
            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Lỗi");
                return;
            }
            await fetchPO();
        } catch (err) {
            console.error(err);
        } finally {
            setTransitioning(false);
        }
    };

    if (loading) {
        return <div className="text-center py-20 text-gray-400">Đang tải...</div>;
    }
    if (!po) {
        return <div className="text-center py-20 text-gray-400">PO không tồn tại</div>;
    }

    const st = PO_STATUS[po.status as POStatusKey];
    const pay = PAYMENT_STATUS[po.paymentStatus as PaymentStatusKey];
    const action = ACTIONS[po.status];
    const currentStepIdx = TIMELINE_STEPS.indexOf(
        po.status === "PARTIALLY_RECEIVED" ? "RECEIVED" : po.status
    );
    const isReceivable = po.status === "IN_TRANSIT" || po.status === "PARTIALLY_RECEIVED";

    const totalCalc = po.items.reduce(
        (s, i) => s + Number(i.quantity) * Number(i.unitPrice),
        0
    );

    return (
        <div className="space-y-6">
            {/* Back */}
            <button
                onClick={() => router.push("/suppliers")}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
            >
                <ArrowLeft size={16} />
                Quay lại
            </button>

            {/* PO Info – 2 cols */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-800">{po.poNumber}</h1>
                        <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${st?.color || "bg-gray-100 text-gray-500"}`}
                        >
                            {st?.label || po.status}
                        </span>
                    </div>
                    <Row label="Supplier" value={po.supplier.supplierName} />
                    <Row label="Ngày tạo" value={formatDate(po.createdAt)} />
                    <Row
                        label="Giao dự kiến"
                        value={po.expectedDelivery ? formatDate(po.expectedDelivery) : "—"}
                    />
                    <Row label="Ship" value={po.shippingMethod || "—"} />
                    {po.notes && <Row label="Ghi chú" value={po.notes} />}
                </div>

                {/* Right */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-center justify-center gap-3">
                    <p className="text-sm text-gray-500">Tổng tiền</p>
                    <p className="text-3xl font-bold text-gray-800">
                        {formatCurrency(Number(po.totalAmount) || totalCalc, po.currency)}
                    </p>
                    <div className="flex gap-2">
                        <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${st?.color || "bg-gray-100"}`}
                        >
                            {st?.label || po.status}
                        </span>
                        <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${pay?.color || "bg-gray-100"}`}
                        >
                            {pay?.label || po.paymentStatus}
                        </span>
                    </div>
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    {TIMELINE_STEPS.map((step, idx) => {
                        const isPast = idx < currentStepIdx;
                        const isCurrent = idx === currentStepIdx;
                        const isFuture = idx > currentStepIdx;

                        return (
                            <div key={step} className="flex items-center flex-1 last:flex-none">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isCurrent
                                                ? "bg-blue-600 border-blue-600 text-white"
                                                : isPast
                                                    ? "bg-blue-100 border-blue-300 text-blue-600"
                                                    : "bg-gray-100 border-gray-200 text-gray-400"
                                            }`}
                                    >
                                        {isPast ? "✓" : idx + 1}
                                    </div>
                                    <span
                                        className={`text-xs mt-1.5 font-medium ${isCurrent
                                                ? "text-blue-600"
                                                : isPast
                                                    ? "text-blue-400"
                                                    : "text-gray-400"
                                            }`}
                                    >
                                        {TIMELINE_LABELS[step]}
                                    </span>
                                </div>
                                {idx < TIMELINE_STEPS.length - 1 && (
                                    <div
                                        className={`flex-1 h-0.5 mx-2 mt-[-16px] ${idx < currentStepIdx ? "bg-blue-300" : "bg-gray-200"
                                            }`}
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-4 py-3 font-semibold text-gray-600">
                                    Nguyên liệu
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                    Số lượng đặt
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                    Đã nhận
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                    Còn lại
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                    Đơn giá
                                </th>
                                <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                    Thành tiền
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {po.items.map((item) => {
                                const qty = Number(item.quantity);
                                const recv = Number(item.receivedQty);
                                const remaining = qty - recv;
                                const lineTotal = qty * Number(item.unitPrice);

                                return (
                                    <tr
                                        key={item.id}
                                        className="border-b border-gray-100 hover:bg-gray-50/50"
                                    >
                                        <td className="px-4 py-3">
                                            <span className="font-mono text-xs text-gray-400 mr-2">
                                                {item.material.materialCode}
                                            </span>
                                            <span className="text-gray-700">
                                                {item.material.materialName}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {qty.toLocaleString("vi-VN")}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            <span
                                                className={
                                                    recv >= qty
                                                        ? "text-green-600 font-medium"
                                                        : recv > 0
                                                            ? "text-orange-500 font-medium"
                                                            : "text-gray-400"
                                                }
                                            >
                                                {recv.toLocaleString("vi-VN")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums">
                                            {remaining > 0 ? (
                                                <span className="text-red-500 font-medium">
                                                    {remaining.toLocaleString("vi-VN")}
                                                </span>
                                            ) : (
                                                <span className="text-green-500">✓</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right tabular-nums text-gray-500">
                                            {formatCurrency(Number(item.unitPrice), po.currency)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                                            {formatCurrency(lineTotal, po.currency)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-blue-50">
                                <td
                                    colSpan={5}
                                    className="px-4 py-3 font-semibold text-gray-700"
                                >
                                    TỔNG CỘNG
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-blue-700 text-lg">
                                    {formatCurrency(totalCalc, po.currency)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                {action && (
                    <button
                        onClick={() => handleTransition(action.target)}
                        disabled={transitioning}
                        className="px-5 py-2.5 bg-[#1E3A5F] text-white rounded-lg text-sm font-medium hover:bg-[#2a4f7f] transition-colors disabled:opacity-50"
                    >
                        {transitioning ? "Đang xử lý..." : action.label}
                    </button>
                )}
                {isReceivable && (
                    <button
                        onClick={() => setShowReceive(true)}
                        className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                    >
                        📦 Nhận hàng
                    </button>
                )}
            </div>

            {/* Receive Modal */}
            {showReceive && (
                <ReceiveModal
                    po={po}
                    onClose={() => setShowReceive(false)}
                    onReceived={fetchPO}
                />
            )}
        </div>
    );
}

/* ================================================================
   RECEIVE MODAL
   ================================================================ */

function ReceiveModal({
    po,
    onClose,
    onReceived,
}: {
    po: PO;
    onClose: () => void;
    onReceived: () => void;
}) {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [receivedQtys, setReceivedQtys] = useState<Record<string, string>>({});

    const handleSubmit = async () => {
        const receivedItems = po.items
            .map((item) => ({
                itemId: item.id,
                receivedQty: parseFloat(receivedQtys[item.id] || "0"),
            }))
            .filter((i) => i.receivedQty > 0);

        if (receivedItems.length === 0) {
            setError("Vui lòng nhập số lượng nhận cho ít nhất 1 item");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/purchase-orders/${po.id}/receive`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ receivedItems }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
            onReceived();
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
                    <h2 className="text-lg font-bold text-gray-800">Nhận hàng</h2>
                    <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b">
                                    <th className="text-left px-3 py-2 font-semibold text-gray-600">
                                        Nguyên liệu
                                    </th>
                                    <th className="text-right px-3 py-2 font-semibold text-gray-600 w-20">
                                        Đặt
                                    </th>
                                    <th className="text-right px-3 py-2 font-semibold text-gray-600 w-20">
                                        Đã nhận
                                    </th>
                                    <th className="text-center px-3 py-2 font-semibold text-gray-600 w-24">
                                        Nhận lần này
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {po.items.map((item) => {
                                    const ordered = Number(item.quantity);
                                    const alreadyReceived = Number(item.receivedQty);
                                    const remaining = ordered - alreadyReceived;

                                    return (
                                        <tr key={item.id} className="border-b border-gray-100">
                                            <td className="px-3 py-2 text-gray-700">
                                                {item.material.materialName}
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-500 tabular-nums">
                                                {ordered.toLocaleString("vi-VN")}
                                            </td>
                                            <td className="px-3 py-2 text-right text-gray-500 tabular-nums">
                                                {alreadyReceived.toLocaleString("vi-VN")}
                                            </td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={remaining}
                                                    value={receivedQtys[item.id] || ""}
                                                    onChange={(e) =>
                                                        setReceivedQtys({
                                                            ...receivedQtys,
                                                            [item.id]: e.target.value,
                                                        })
                                                    }
                                                    placeholder={String(remaining)}
                                                    className="w-full text-center border border-gray-200 rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                        💡 Sau khi xác nhận, số lượng nhận sẽ tự động cộng vào tồn kho
                        nguyên liệu.
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={saving}
                            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {saving ? "Đang xử lý..." : "Xác nhận nhận hàng"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================================================================
   INFO ROW
   ================================================================ */

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-800">{value}</span>
        </div>
    );
}
