import { cn } from "@/lib/utils";
import {
    WORK_ORDER_STATUS,
    PO_STATUS,
    FBA_SHIPMENT_STATUS,
    PAYMENT_STATUS,
    type WorkOrderStatusKey,
    type POStatusKey,
    type FBAShipmentStatusKey,
    type PaymentStatusKey,
} from "@/lib/constants";

const STATUS_MAPS = {
    workOrder: WORK_ORDER_STATUS,
    po: PO_STATUS,
    fbaShipment: FBA_SHIPMENT_STATUS,
    payment: PAYMENT_STATUS,
} as const;

type StatusType = keyof typeof STATUS_MAPS;

type StatusKeyMap = {
    workOrder: WorkOrderStatusKey;
    po: POStatusKey;
    fbaShipment: FBAShipmentStatusKey;
    payment: PaymentStatusKey;
};

interface StatusBadgeProps<T extends StatusType> {
    status: StatusKeyMap[T];
    type: T;
    className?: string;
}

export default function StatusBadge<T extends StatusType>({
    status,
    type,
    className,
}: StatusBadgeProps<T>) {
    const statusMap = STATUS_MAPS[type] as Record<
        string,
        { label: string; color: string }
    >;
    const config = statusMap[status as string];

    if (!config) {
        return (
            <span
                className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500",
                    className
                )}
            >
                {String(status)}
            </span>
        );
    }

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                config.color,
                className
            )}
        >
            {config.label}
        </span>
    );
}
