import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCartStore } from "../store/cart";
import { colors } from "../theme/colors";

export default function CartPage() {
  const { items, total, isLoading, fetchCart, updateItem, removeItem } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const currency = "AED";

  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: colors.text.secondary, fontSize: 18 }}>جاري التحميل...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        dir="rtl"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          padding: "120px 24px 60px",
        }}
      >
        <ShoppingBag size={64} color={colors.blue[700]} opacity={0.5} />
        <h2 style={{ color: colors.text.primary, fontSize: 24, fontWeight: 700 }}>سلتك فارغة</h2>
        <p style={{ color: colors.text.secondary }}>أضف قطع غيار مناسبة لسيارتك</p>
        <Link
          to="/"
          style={{
            background: colors.gradients.blueFire,
            color: "#fff",
            padding: "12px 32px",
            borderRadius: 12,
            textDecoration: "none",
            fontWeight: 700,
            fontSize: 16,
          }}
        >
          تصفّح القطع
        </Link>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", padding: "100px 5% 60px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: "none", border: "none", cursor: "pointer", color: colors.text.secondary }}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ color: colors.text.primary, fontSize: 26, fontWeight: 800 }}>
            سلة التسوق ({items.length} منتجات)
          </h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
          {/* Items list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  style={{
                    background: colors.background.secondary,
                    borderRadius: 16,
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: 20,
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                  }}
                >
                  {/* Image */}
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      background: colors.background.secondary,
                      flexShrink: 0,
                      overflow: "hidden",
                    }}
                  >
                    {item.images && (
                      <img
                        src={JSON.parse(item.images || "[]")[0] ?? ""}
                        alt={item.name_ar}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ color: colors.text.primary, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                      {item.name_ar}
                    </div>
                    <div style={{ color: colors.blue[400], fontWeight: 800, fontSize: 18 }}>
                      {(item.price * item.quantity).toFixed(2)} {currency}
                    </div>
                    <div style={{ color: colors.text.muted, fontSize: 13 }}>
                      {item.price.toFixed(2)} {currency} / للقطعة
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      onClick={() => updateItem(item.id, item.quantity - 1)}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: colors.background.secondary,
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: colors.text.primary, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ color: colors.text.primary, fontWeight: 700, minWidth: 24, textAlign: "center" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: colors.background.secondary,
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: colors.text.primary, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "#ef4444", marginRight: 8,
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order summary */}
          <div
            style={{
              background: colors.background.secondary,
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.08)",
              padding: 28,
              position: "sticky",
              top: 90,
            }}
          >
            <h3 style={{ color: colors.text.primary, fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
              ملخص الطلب
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <Row label="المجموع الفرعي" value={`${total.toFixed(2)} ${currency}`} />
              <Row label="الشحن" value="مجاني" valueColor="#22c55e" />
              <Row label="ضريبة القيمة المضافة 5%" value={`${(total * 0.05).toFixed(2)} ${currency}`} />
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
                <Row
                  label="الإجمالي"
                  value={`${(total * 1.05).toFixed(2)} ${currency}`}
                  labelBold
                  valueBold
                />
              </div>
            </div>
            <button
              onClick={() => navigate("/checkout")}
              style={{
                width: "100%",
                background: colors.gradients.blueFire,
                color: "#fff",
                border: "none",
                borderRadius: 14,
                padding: "14px 0",
                fontFamily: "inherit",
                fontSize: 16,
                fontWeight: 800,
                cursor: "pointer",
                marginBottom: 12,
              }}
            >
              إتمام الشراء
            </button>
            <Link
              to="/"
              style={{
                display: "block",
                textAlign: "center",
                color: colors.text.secondary,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              متابعة التسوق
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label, value, valueColor, labelBold, valueBold,
}: {
  label: string; value: string; valueColor?: string; labelBold?: boolean; valueBold?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ color: colors.text.secondary, fontWeight: labelBold ? 700 : 400 }}>{label}</span>
      <span style={{ color: valueColor ?? colors.text.primary, fontWeight: valueBold ? 800 : 500 }}>{value}</span>
    </div>
  );
}
