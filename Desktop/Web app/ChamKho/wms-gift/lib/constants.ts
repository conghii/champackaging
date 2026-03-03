// ============================================================
// WMS Gift - Constants & Status Labels (Tiếng Việt)
// ============================================================

export const WORK_ORDER_STATUS = {
    DRAFT: { label: "Nháp", color: "bg-gray-100 text-gray-600" },
    PENDING: { label: "Chờ xuất NL", color: "bg-yellow-100 text-yellow-700" },
    IN_PROGRESS: { label: "Đang SX", color: "bg-blue-100 text-blue-700" },
    PAUSED: { label: "Tạm dừng", color: "bg-orange-100 text-orange-700" },
    QC_CHECK: { label: "Kiểm tra QC", color: "bg-purple-100 text-purple-700" },
    PACKAGING: { label: "Đóng gói", color: "bg-cyan-100 text-cyan-700" },
    COMPLETED: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
    CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-600" },
} as const;

export const PO_STATUS = {
    DRAFT: { label: "Nháp", color: "bg-gray-100 text-gray-600" },
    SENT: { label: "Đã gửi", color: "bg-blue-100 text-blue-700" },
    CONFIRMED: { label: "Đã xác nhận", color: "bg-indigo-100 text-indigo-700" },
    IN_TRANSIT: {
        label: "Đang vận chuyển",
        color: "bg-yellow-100 text-yellow-700",
    },
    PARTIALLY_RECEIVED: {
        label: "Nhận 1 phần",
        color: "bg-orange-100 text-orange-700",
    },
    RECEIVED: { label: "Đã nhận đủ", color: "bg-green-100 text-green-700" },
    CLOSED: { label: "Đã đóng", color: "bg-purple-100 text-purple-700" },
    CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-600" },
} as const;

export const FBA_SHIPMENT_STATUS = {
    PLANNING: { label: "Lên kế hoạch", color: "bg-gray-100 text-gray-600" },
    LABELING: { label: "In nhãn", color: "bg-yellow-100 text-yellow-700" },
    READY_TO_SHIP: {
        label: "Sẵn sàng ship",
        color: "bg-blue-100 text-blue-700",
    },
    SHIPPED: { label: "Đã gửi", color: "bg-indigo-100 text-indigo-700" },
    IN_TRANSIT: {
        label: "Đang vận chuyển",
        color: "bg-cyan-100 text-cyan-700",
    },
    DELIVERED: {
        label: "Amazon đã nhận",
        color: "bg-teal-100 text-teal-700",
    },
    RECEIVING: {
        label: "Đang check-in",
        color: "bg-orange-100 text-orange-700",
    },
    LIVE: { label: "Đang bán", color: "bg-green-100 text-green-700" },
    CLOSED: { label: "Đã đóng", color: "bg-purple-100 text-purple-700" },
} as const;

export const PAYMENT_STATUS = {
    UNPAID: { label: "Chưa thanh toán", color: "bg-gray-100 text-gray-600" },
    DEPOSIT_PAID: { label: "Đã cọc", color: "bg-blue-100 text-blue-700" },
    PARTIALLY_PAID: {
        label: "Thanh toán 1 phần",
        color: "bg-yellow-100 text-yellow-700",
    },
    FULLY_PAID: {
        label: "Đã thanh toán đủ",
        color: "bg-green-100 text-green-700",
    },
    OVERDUE: { label: "Quá hạn", color: "bg-red-100 text-red-600" },
} as const;

export const STOCK_ALERT = {
    normal: {
        label: "Đủ hàng",
        color: "bg-green-100 text-green-700",
        icon: "✅",
    },
    warning: {
        label: "Sắp hết",
        color: "bg-yellow-100 text-yellow-700",
        icon: "⚠️",
    },
    critical: {
        label: "Nguy hiểm",
        color: "bg-red-100 text-red-600",
        icon: "🔴",
    },
    out: {
        label: "Hết hàng",
        color: "bg-gray-100 text-gray-500",
        icon: "⛔",
    },
} as const;

// Type helpers
export type WorkOrderStatusKey = keyof typeof WORK_ORDER_STATUS;
export type POStatusKey = keyof typeof PO_STATUS;
export type FBAShipmentStatusKey = keyof typeof FBA_SHIPMENT_STATUS;
export type PaymentStatusKey = keyof typeof PAYMENT_STATUS;
export type StockAlertKey = keyof typeof STOCK_ALERT;
