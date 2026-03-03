"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    Boxes,
    Factory,
    Truck,
    ShoppingCart,
    Users,
    BarChart3,
    LogOut,
    X,
} from "lucide-react";

const menuItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Sản phẩm & SKU", icon: Package, href: "/products" },
    { label: "Nguyên liệu & Kho", icon: Boxes, href: "/materials" },
    { label: "Sản xuất", icon: Factory, href: "/production" },
    { label: "Nhập hàng & Supplier", icon: Truck, href: "/suppliers" },
    { label: "Amazon FBA", icon: ShoppingCart, href: "/fba" },
    { label: "Nhân sự", icon: Users, href: "/hr" },
    { label: "Chi phí & P&L", icon: BarChart3, href: "/costs" },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`
          fixed top-0 left-0 z-50 h-full w-[240px] flex flex-col
          bg-[#1E3A5F] text-white
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🏭</span>
                        <span className="font-bold text-lg tracking-tight">WMS Gift</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 rounded-md hover:bg-white/10 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive =
                            pathname === item.href || pathname.startsWith(item.href + "/");
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive
                                        ? "bg-blue-500/90 text-white shadow-md shadow-blue-500/20"
                                        : "text-white/70 hover:bg-white/10 hover:text-white"
                                    }
                `}
                            >
                                <item.icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* User section */}
                <div className="border-t border-white/10 p-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-400/30 flex items-center justify-center text-sm font-bold">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">Admin</p>
                            <p className="text-xs text-white/50 truncate">admin@wmsgift.vn</p>
                        </div>
                        <button className="p-1.5 rounded-md hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
