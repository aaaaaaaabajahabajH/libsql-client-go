import DeliveryTracker from "../components/DeliveryTracker";

// ════════════════════════════════════════════
// 🚚  ORDERS / DELIVERY TRACKING PAGE
// ════════════════════════════════════════════
export default function Orders({ lang, t }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gray-900">🚚 {t.orders}</h1>
      <DeliveryTracker lang={lang} orderId="ORD-2024-0042" />
    </div>
  );
}
