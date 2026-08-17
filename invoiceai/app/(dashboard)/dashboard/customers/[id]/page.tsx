import { PlaceholderPage } from "@/components/placeholder-page";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <PlaceholderPage
      title={`ملف العميل #${id}`}
      description="بيانات العميل، فواتيره، إجمالي المستحق عليه"
      phase="مرحلة Customers"
    />
  );
}
