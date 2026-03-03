"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/products": "Sản phẩm & SKU",
    "/materials": "Nguyên liệu & Kho",
    "/production": "Sản xuất",
    "/suppliers": "Nhập hàng & Supplier",
    "/fba": "Amazon FBA",
    "/hr": "Nhân sự",
    "/costs": "Chi phí & P&L",
};

function getVietnameseDay(date: Date): string {
    const days = [
        "Chủ nhật",
        "Thứ 2",
        "Thứ 3",
        "Thứ 4",
        "Thứ 5",
        "Thứ 6",
        "Thứ 7",
    ];
    return days[date.getDay()];
}

function formatDate(date: Date): string {
    const day = getVietnameseDay(date);
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${day}, ${dd}/${mm}/${yyyy}`;
}

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const pathname = usePathname();
    const pageTitle = pageTitles[pathname] || "WMS Gift";
    const today = formatDate(new Date());

    return (
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
            {/* Left: Hamburger + Breadcrumb */}
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                >
                    <Menu size={22} />
                </button>
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>🏭 WMS Gift</span>
                        <span>/</span>
                        <span className="text-gray-700 font-medium">{pageTitle}</span>
                    </div>
                </div>
            </div>

            {/* Right: Date + Notification */}
            <div className="flex items-center gap-5">
                <span className="hidden sm:block text-sm text-gray-500">{today}</span>
                <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
                    <Bell size={20} />
                    <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        3
                    </span>
                </button>
            </div>
        </header>
    );
}
