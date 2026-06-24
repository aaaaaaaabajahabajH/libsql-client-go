import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Package, CheckCircle, Truck, Clock, XCircle, ArrowLeft,
} from "lucide-react";
import api from "../api/client";
import { colors } from "../theme/colors";

interface Order {
  id: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: "قيد المعالجة", icon: <Clock size={18} />, color: "#FFB800" },
  confirmed: { label: "تم التأكيد", icon: <CheckCircle size={18} />, color: "#00FF88" },
  shipped: { label: "في الطريق", icon: <Truck size={18} />, color: colors.blue[400] },
  delivered: { label: "تم التسليم", icon: <CheckCircle size={18} />, color: "#00FF88" },
  cancelled: { label: "ملغي", icon: <XCircle size={18} />, color: colors.error },
};

// Single-order detail view (when :id is present)
function OrderDetail({ orderId }: { orderId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => api.get<{ data: Order }>(`/orders/${orderId}`).then((r) => r.data.data),
  });

  const params = new URLSearchParams(window.location.search);
  const paymentResult = params.get("payment");

  if (isLoading) return <LoadingState />;
  if (error || !data) return <ErrorState />;

  const s = STATUS_MAP[data.status] ?? STATUS_MAP.pending;
  const currency = "AED";

  return (
    <div dir="rtl" style={{ minHeight: "100vh", padding: "100px 5% 60px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Payment outcome banner */}
        {paymentResult === "success" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "rgba(0,255,136,0.08)",
              border: "1px solid rgba(0,255,136,0.3)",
              borderRadius: 14,
              padding: "16px 24px",
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "#00FF88",
              fontWeight: 700,
            }}
          >
            <CheckCircle size={22} />
            تم الدفع بنجاح! سيتم تجهيز طلبك في أقرب وقت.
          </motion.div>
        )}
        {paymentResult === "cancelled" && (
          <div
            style={{
              background: "rgba(255,183,0,0.08)",
              border: "1px solid rgba(255,183,0,0.3)",
              borderRadius: 14,
              padding: "16px 24px",
              marginBottom: 24,
              color: "#FFB800",
              fontWeight: 700,
            }}
          >
            تم إلغاء عملية الدفع. يمكنك المحاولة مجدداً.
          </div>
        )}

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <Link to="/orders" style={{ color: colors.text.secondary, display: "flex" }}>
            <ArrowLeft size={22} />
          </Link>
          <h1 style={{ color: colors.text.primary, fontSize: 24, fontWeight: 800 }}>
            تفاصيل الطلب
          </h1>
        </div>

        <div
          style={{
            background: colors.background.secondary,
            borderRadius: 20,
            border: "1px solid rgba(255,255,255,0.08)",
            padding: 28,
          }}
        >
          {/* Status indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 24,
              padding: "12px 16px",
              borderRadius: 12,
              background: `${s.color}14`,
              border: `1px solid ${s.color}33`,
            }}
          >
            <span style={{ color: s.color }}>{s.icon}</span>
            <span style={{ color: s.color, fontWeight: 700 }}>{s.label}</span>
          </div>

          <InfoRow label="رقم الطلب" value={data.id} mono />
          <InfoRow label="التاريخ" value={new Date(data.created_at).toLocaleString("ar-AE")} />
          <InfoRow label="إجمالي الطلب" value={`${Number(data.total_amount).toFixed(2)} ${currency}`} bold />
          <InfoRow label="عنوان التوصيل" value={data.shipping_address} />
        </div>

        <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
          <Link
            to="/orders"
            style={{
              flex: 1,
              display: "block",
              textAlign: "center",
              padding: "12px 0",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              color: colors.text.secondary,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            كل طلباتي
          </Link>
          <Link
            to="/"
            style={{
              flex: 1,
              display: "block",
              textAlign: "center",
              padding: "12px 0",
              borderRadius: 12,
              background: colors.gradients.blueFire,
              color: "#fff",
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            متابعة التسوق
          </Link>
        </div>
      </div>
    </div>
  );
}

// Orders list view
function OrdersList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get<{ data: Order[] }>("/orders").then((r) => r.data.data ?? []),
  });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;

  const orders = data ?? [];

  return (
    <div dir="rtl" style={{ minHeight: "100vh", padding: "100px 5% 60px" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <Package size={28} color={colors.blue[400]} />
          <h1 style={{ color: colors.text.primary, fontSize: 24, fontWeight: 800 }}>طلباتي</h1>
        </div>

        {orders.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: 60,
              color: colors.text.secondary,
              background: colors.background.secondary,
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Package size={48} opacity={0.3} style={{ margin: "0 auto 16px" }} />
            <p>لا توجد طلبات بعد</p>
            <Link
              to="/"
              style={{
                display: "inline-block",
                marginTop: 20,
                padding: "10px 28px",
                background: colors.gradients.blueFire,
                color: "#fff",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              تسوق الآن
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {orders.map((order, i) => {
              const s = STATUS_MAP[order.status] ?? STATUS_MAP.pending;
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={`/orders/${order.id}`}
                    style={{
                      display: "block",
                      textDecoration: "none",
                      background: colors.background.secondary,
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 16,
                      padding: "18px 22px",
                      transition: "border-color 0.2s",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ color: colors.text.primary, fontWeight: 700, marginBottom: 4 }}>
                          طلب #{order.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div style={{ color: colors.text.muted, fontSize: 12 }}>
                          {new Date(order.created_at).toLocaleDateString("ar-AE")}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{ color: colors.text.primary, fontWeight: 800 }}>
                          {Number(order.total_amount).toFixed(2)} AED
                        </span>
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: s.color,
                            fontWeight: 700,
                            fontSize: 13,
                          }}
                        >
                          {s.icon}
                          {s.label}
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Public export: routes to detail or list based on URL param
export default function OrdersPage() {
  const { id } = useParams<{ id?: string }>();
  return id ? <OrderDetail orderId={id} /> : <OrdersList />;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function InfoRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span style={{ color: colors.text.secondary, fontSize: 14 }}>{label}</span>
      <span
        style={{
          color: colors.text.primary,
          fontSize: 14,
          fontWeight: bold ? 800 : 500,
          fontFamily: mono ? "monospace" : "inherit",
          maxWidth: "55%",
          textAlign: "left",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: colors.text.secondary }}>جاري التحميل...</div>
    </div>
  );
}

function ErrorState() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: colors.error }}>تعذّر تحميل البيانات</div>
    </div>
  );
}
