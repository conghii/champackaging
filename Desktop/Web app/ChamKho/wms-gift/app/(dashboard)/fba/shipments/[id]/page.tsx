import FBAShipmentDetailClient from "@/components/fba-shipment-detail-client";

export default function FBAShipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Use React.use to unwrap params since in Next.js 15 they are promises, but this is 14 based on our env usually.
    // The user prompt mentioned Next.js 14, in app router page params can just be taken after unwrapping.
    // Actually, to be safe and compatible with the prompt's `params: Promise<{ id: string }>` type, we can return an async component.

    return <WrapperComponent params={params} />;
}

async function WrapperComponent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <FBAShipmentDetailClient id={id} />;
}
