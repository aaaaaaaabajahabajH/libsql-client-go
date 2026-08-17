import { PlaceholderPage } from "@/components/placeholder-page";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PlaceholderPage
      title={`تفاصيل الفاتورة #${id}`}
      description="عرض، تعديل، نسخ، PDF، مشاركة، تغيير الحالة"
      phase="مرحلة Invoices"
    />
  );
}
