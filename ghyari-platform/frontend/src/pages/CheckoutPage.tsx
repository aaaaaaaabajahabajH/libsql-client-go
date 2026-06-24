import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { CreditCard, Banknote, ArrowLeft, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "../store/cart";
import { useQuery } from "@tanstack/react-query";
import api from "../api/client";
import { colors } from "../theme/colors";

const schema = z.object({
  name: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(9, "رقم الجوال مطلوب"),
  city: z.string().min(2, "المدينة مطلوبة"),
  address: z.string().min(10, "العنوان مطلوب (10 أحرف على الأقل)"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

type PaymentMethod = "ngenius" | "tabby" | "cod";

interface OrderResp {
  order_id: string;
  status: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, clear } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ngenius");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<{ name: string; phone: string; email: string }>("/users/me").then((r) => r.data),
    retry: false,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (me) reset({ name: me.name, phone: me.phone });
  }, [me, reset]);

  useEffect(() => {
    if (items.length === 0) navigate("/cart");
  }, [items.length, navigate]);

  const currency = "AED";
  const vat = total * 0.05;
  const grandTotal = total + vat;

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // 1. Create the order
      const orderRes = await api.post<OrderResp>("/orders", {
        shipping_address: `${data.name} | ${data.phone} | ${data.city} | ${data.address}`,
        payment_method: paymentMethod,
        notes: data.notes ?? "",
      });
      const orderId = orderRes.data.order_id;

      // 2. Initiate payment
      if (paymentMethod === "ngenius") {
        const payRes = await api.post<{ payment_url: string }>("/payments/ngenius", {
          order_id: orderId,
          currency,
        });
        clear();
        window.location.href = payRes.data.payment_url;
        return;
      }

      if (paymentMethod === "tabby") {
        const payRes = await api.post<{ payment_url: string }>("/payments/tabby", {
          order_id: orderId,
          currency,
        });
        clear();
        window.location.href = payRes.data.payment_url;
        return;
      }

      if (paymentMethod === "cod") {
        await api.post("/payments/cod", { order_id: orderId });
        clear();
        toast.success("تم تأكيد طلبك بالدفع عند الاستلام");
        navigate(`/orders/${orderId}`);
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg === "tabby_not_available"
        ? "التقسيط غير متاح لهذا الطلب — يرجى اختيار طريقة دفع أخرى"
        : "حدث خطأ، يرجى المحاولة مجدداً");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", padding: "100px 5% 60px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <button
            onClick={() => navigate("/cart")}
            style={{ background: "none", border: "none", cursor: "pointer", color: colors.text.secondary }}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 style={{ color: colors.text.primary, fontSize: 26, fontWeight: 800 }}>إتمام الطلب</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, alignItems: "start" }}>
            {/* Left: address + payment */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Shipping */}
              <Section title="بيانات التوصيل">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label="الاسم الكامل" error={errors.name?.message}>
                    <input {...register("name")} placeholder="محمد العمري" style={inputStyle} />
                  </Field>
                  <Field label="رقم الجوال" error={errors.phone?.message}>
                    <input {...register("phone")} placeholder="+971 50 000 0000" style={inputStyle} dir="ltr" />
                  </Field>
                </div>
                <Field label="المدينة" error={errors.city?.message}>
                  <input {...register("city")} placeholder="دبي" style={inputStyle} />
                </Field>
                <Field label="العنوان التفصيلي" error={errors.address?.message}>
                  <textarea
                    {...register("address")}
                    placeholder="المنطقة، الشارع، رقم المبنى، الطابق..."
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </Field>
                <Field label="ملاحظات (اختياري)">
                  <input {...register("notes")} placeholder="أي تعليمات خاصة للمندوب..." style={inputStyle} />
                </Field>
              </Section>

              {/* Payment method */}
              <Section title="طريقة الدفع">
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <PaymentOption
                    id="ngenius"
                    selected={paymentMethod === "ngenius"}
                    onSelect={() => setPaymentMethod("ngenius")}
                    icon={<CreditCard size={22} color={colors.blue[400]} />}
                    title="بطاقة بنكية / Apple Pay / Google Pay"
                    subtitle="Visa • Mastercard • Apple Pay • Google Pay • Samsung Pay"
                    badge="الأكثر أماناً"
                    badgeColor={colors.blue[500]}
                  />
                  <PaymentOption
                    id="tabby"
                    selected={paymentMethod === "tabby"}
                    onSelect={() => setPaymentMethod("tabby")}
                    icon={
                      <span style={{ fontSize: 22, fontWeight: 900, color: "#3DDB85" }}>t</span>
                    }
                    title="Tabby — اشتر الآن وادفع لاحقاً"
                    subtitle="4 أقساط متساوية بدون فوائد أو رسوم"
                    badge="بدون فوائد"
                    badgeColor="#3DDB85"
                  />
                  <PaymentOption
                    id="cod"
                    selected={paymentMethod === "cod"}
                    onSelect={() => setPaymentMethod("cod")}
                    icon={<Banknote size={22} color={colors.orange[400]} />}
                    title="الدفع عند الاستلام"
                    subtitle="ادفع نقداً أو بالبطاقة عند تسليم طلبك"
                  />
                </div>

                {paymentMethod === "tabby" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    style={{
                      marginTop: 12,
                      padding: 14,
                      borderRadius: 12,
                      background: "rgba(61,219,133,0.06)",
                      border: "1px solid rgba(61,219,133,0.2)",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    ستدفع{" "}
                    <strong style={{ color: "#3DDB85" }}>
                      {(grandTotal / 4).toFixed(2)} {currency}
                    </strong>{" "}
                    الآن وثلاثة أقساط متساوية على مدار 3 أشهر. يتحمل Tabby مخاطر الائتمان.
                    المبلغ الكلي: {grandTotal.toFixed(2)} {currency}
                  </motion.div>
                )}
              </Section>
            </div>

            {/* Right: summary */}
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
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}
                  >
                    <span style={{ color: colors.text.secondary }}>
                      {item.name_ar} × {item.quantity}
                    </span>
                    <span style={{ color: colors.text.primary }}>
                      {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  paddingTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  marginBottom: 24,
                }}
              >
                <SummaryRow label="المجموع الفرعي" value={`${total.toFixed(2)} ${currency}`} />
                <SummaryRow label="ضريبة 5%" value={`${vat.toFixed(2)} ${currency}`} />
                <SummaryRow label="الشحن" value="مجاني" valueColor="#22c55e" />
                <SummaryRow
                  label="الإجمالي"
                  value={`${grandTotal.toFixed(2)} ${currency}`}
                  bold
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  background: isSubmitting ? colors.carbon[600] : colors.gradients.blueFire,
                  color: "#fff",
                  border: "none",
                  borderRadius: 14,
                  padding: "14px 0",
                  fontFamily: "inherit",
                  fontSize: 16,
                  fontWeight: 800,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {isSubmitting ? (
                  "جاري المعالجة..."
                ) : (
                  <>
                    <CheckCircle size={18} />
                    {paymentMethod === "cod" ? "تأكيد الطلب" : "الانتقال للدفع"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: colors.background.secondary,
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 24,
      }}
    >
      <h3 style={{ color: colors.text.primary, fontSize: 16, fontWeight: 800, marginBottom: 20 }}>{title}</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </div>
  );
}

function Field({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={{ color: colors.text.secondary, fontSize: 13, display: "block", marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {error && <p style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

function PaymentOption({
  id, selected, onSelect, icon, title, subtitle, badge, badgeColor,
}: {
  id: string;
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        background: selected ? "rgba(0,102,255,0.08)" : colors.background.tertiary,
        border: `2px solid ${selected ? colors.blue[500] : "rgba(255,255,255,0.08)"}`,
        borderRadius: 14,
        padding: "16px 18px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 14,
        width: "100%",
        textAlign: "right",
        transition: "all 0.2s",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ color: colors.text.primary, fontWeight: 700, fontSize: 14 }}>{title}</span>
          {badge && (
            <span
              style={{
                background: `${badgeColor}22`,
                color: badgeColor,
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
                border: `1px solid ${badgeColor}44`,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <div style={{ color: colors.text.muted, fontSize: 12 }}>{subtitle}</div>
      </div>
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: `2px solid ${selected ? colors.blue[500] : "rgba(255,255,255,0.2)"}`,
          background: selected ? colors.blue[500] : "transparent",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
      </div>
    </button>
  );
}

function SummaryRow({
  label, value, valueColor, bold,
}: {
  label: string; value: string; valueColor?: string; bold?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: colors.text.secondary, fontWeight: bold ? 700 : 400, fontSize: 14 }}>{label}</span>
      <span style={{ color: valueColor ?? colors.text.primary, fontWeight: bold ? 800 : 500, fontSize: 14 }}>
        {value}
      </span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: colors.background.tertiary,
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "10px 14px",
  color: colors.text.primary,
  fontFamily: "inherit",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
};
