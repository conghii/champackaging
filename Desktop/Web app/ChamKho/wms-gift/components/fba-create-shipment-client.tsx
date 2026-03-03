"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ChevronRight, PackagePlus, Truck } from "lucide-react";

export default function FBACreateShipmentClient() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    // Step 1: Info
    const [shipmentName, setShipmentName] = useState("");
    const [destinationFc, setDestinationFc] = useState("");
    const [shipDate, setShipDate] = useState(new Date().toISOString().split("T")[0]);

    // Step 2: Items
    const [products, setProducts] = useState<any[]>([]);
    const [items, setItems] = useState<{ productId: string; quantity: number }[]>([]);
    const [selProductId, setSelProductId] = useState("");
    const [selQty, setSelQty] = useState("");

    // Step 3: Packing
    const [shippingCost, setShippingCost] = useState("0");

    useEffect(() => {
        fetch("/api/fba/inventory").then(r => r.json()).then(d => {
            setProducts(d.inventory?.map((i: any) => i.product) || []);
        }).catch();
    }, []);

    const totalUnits = items.reduce((s, i) => s + i.quantity, 0);

    const addItem = () => {
        if (!selProductId || !selQty) return;
        const qty = Number(selQty);
        if (qty <= 0) return;

        setItems(prev => {
            const ex = prev.find(p => p.productId === selProductId);
            if (ex) return prev.map(p => p.productId === selProductId ? { ...p, quantity: p.quantity + qty } : p);
            return [...prev, { productId: selProductId, quantity: qty }];
        });
        setSelProductId("");
        setSelQty("");
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(p => p.productId !== id));
    };

    const handleSubmit = async () => {
        if (items.length === 0) return alert("Thêm ít nhất 1 SKU");
        if (!shipmentName) return alert("Nhập tên lô hàng");

        setSaving(true);
        try {
            const res = await fetch("/api/fba/shipments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    shipmentName, destinationFc, shipDate, shippingCost, items
                })
            });
            if (!res.ok) throw new Error((await res.json()).error);
            const d = await res.json();
            router.push(`/fba/shipments/${d.id}`);
        } catch (e: any) {
            alert(e.message);
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={() => router.push("/fba")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft size={16} /> Quay lại Quản lý FBA
            </button>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                {/* WIZARD HEADER */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    {[
                        { n: 1, title: "Thông tin lô hàng" },
                        { n: 2, title: "Sản phẩm gửi đi" },
                        { n: 3, title: "Inbound Fee" },
                        { n: 4, title: "Xác nhận & Tạo" }
                    ].map((s, idx) => (
                        <div key={s.n} className="flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step > s.n ? "bg-emerald-500 text-white" : step === s.n ? "bg-[#1E3A5F] text-white ring-4 ring-blue-100" : "bg-gray-200 text-gray-400"
                                }`}>
                                {step > s.n ? <CheckCircle2 size={16} /> : s.n}
                            </div>
                            <span className={`text-xs font-semibold ${step >= s.n ? "text-gray-800" : "text-gray-400"}`}>{s.title}</span>
                        </div>
                    ))}
                </div>

                {/* STEP CONTENT */}
                <div className="p-8 min-h-[300px]">
                    {step === 1 && (
                        <div className="max-w-md mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên lô hàng (Shipment ID / Name) *</label>
                                <input type="text" value={shipmentName} onChange={e => setShipmentName(e.target.value)} placeholder="FBA (12/10/2026 10:20) - 1" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amazon FC (Destination)</label>
                                <input type="text" value={destinationFc} onChange={e => setDestinationFc(e.target.value)} placeholder="VD: ONT8, BNA1, MDW2..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dự kiến ngày Ship</label>
                                <input type="date" value={shipDate} onChange={e => setShipDate(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-end gap-3 w-full">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-blue-900 mb-1">Chọn sản phẩm nhập FBA</label>
                                    <select value={selProductId} onChange={e => setSelProductId(e.target.value)} className="w-full px-4 py-2 border border-blue-200 rounded-lg bg-white">
                                        <option value="">— Chọn SKU —</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.skuCode} ({p.productName})</option>)}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="block text-sm font-medium text-blue-900 mb-1">Số lượng</label>
                                    <input type="number" min="1" value={selQty} onChange={e => setSelQty(e.target.value)} className="w-full px-4 py-2 border border-blue-200 rounded-lg bg-white box-border" />
                                </div>
                                <button onClick={addItem} disabled={!selProductId || !selQty} className="h-[42px] px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                                    <PackagePlus size={18} /> Thêm
                                </button>
                            </div>

                            {items.length > 0 && (
                                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 border-b">
                                            <tr>
                                                <th className="px-6 py-3">SKU</th>
                                                <th className="px-6 py-3 text-right">Số lượng FBA</th>
                                                <th className="px-6 py-3"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {items.map(it => {
                                                const p = products.find(x => x.id === it.productId);
                                                return (
                                                    <tr key={it.productId} className="hover:bg-gray-50">
                                                        <td className="px-6 py-3 font-medium text-gray-800">{p?.productName} <span className="text-gray-400 font-mono font-normal ml-2">{p?.skuCode}</span></td>
                                                        <td className="px-6 py-3 text-right font-bold text-emerald-600">{it.quantity.toLocaleString()} pcs</td>
                                                        <td className="px-6 py-3 text-right">
                                                            <button onClick={() => removeItem(it.productId)} className="text-red-500 hover:text-red-700 font-medium text-xs">Xóa</button>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                            <tr className="bg-gray-50/50">
                                                <td className="px-6 py-3 font-bold text-gray-600 text-right">TỔNG CỘNG:</td>
                                                <td className="px-6 py-3 font-bold text-emerald-700 text-right text-lg">{totalUnits.toLocaleString()}</td>
                                                <td></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="max-w-sm mx-auto space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600 mb-3">
                                    <Truck size={32} />
                                </div>
                                <h3 className="font-bold text-gray-800">Chi phí Ship nội địa / FBA Inbound</h3>
                                <p className="text-sm text-gray-500 mt-1">Ghi nhận cước vận chuyển (Shipping cost)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cước vận chuyển USD ($)</label>
                                <input type="number" step="0.01" value={shippingCost} onChange={e => setShippingCost(e.target.value)} className="w-full px-4 py-3 text-center font-bold text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]" />
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="max-w-lg mx-auto space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                                <h3 className="text-lg font-bold text-green-800 mb-2">Sẵn sàng tạo lô hàng FBA</h3>
                                <p className="text-sm text-green-700">Hãy kiểm tra lại thông tin tóm tắt bên dưới. Lô hàng sẽ được tạo ở trạng thái <b>PLANNING (Lên kế hoạch)</b>.</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-gray-500">Tên lô:</span><span className="font-bold text-gray-800">{shipmentName}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Amazon FC:</span><span className="font-bold text-blue-600">{destinationFc || "—"}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Tổng Units:</span><span className="font-bold text-emerald-600 text-lg">{totalUnits}</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Số lượng SKU:</span><span className="font-bold">{items.length} SKUs</span></div>
                                <div className="flex justify-between"><span className="text-gray-500">Inbound Fee:</span><span className="font-bold text-orange-600">${Number(shippingCost).toFixed(2)}</span></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* WIZARD FOOTER */}
                <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100 bg-gray-50">
                    <button onClick={() => setStep(step - 1)} disabled={step === 1 || saving} className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-0 transition-opacity">
                        Quay lại
                    </button>

                    {step < 4 ? (
                        <button onClick={() => setStep(step + 1)} disabled={step === 1 ? !shipmentName : step === 2 ? items.length === 0 : false} className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-[#1E3A5F] rounded-lg hover:bg-[#2a4f7f] disabled:opacity-50 transition-colors">
                            Tiếp tục <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-8 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
                            {saving ? "Đang tạo..." : "✅ Xác nhận & Tạo Lô Hàng FBA"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}
