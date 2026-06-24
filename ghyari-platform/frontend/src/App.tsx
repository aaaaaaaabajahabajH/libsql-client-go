import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import HeroSection3D from "./components/HeroSection3D";
import CatalogPage from "./pages/CatalogPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import { colors } from "./theme/colors";
import { useCartStore } from "./store/cart";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
});

// Inject Arabic font + global styles
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Tajawal', system-ui, sans-serif;
      background: ${colors.background.primary};
      color: ${colors.text.primary};
      direction: rtl;
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Carbon fiber background texture */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background: ${colors.gradients.carbonFiber};
      pointer-events: none;
      z-index: 0;
    }

    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: ${colors.background.primary}; }
    ::-webkit-scrollbar-thumb { background: ${colors.blue[700]}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${colors.blue[500]}; }

    ::selection {
      background: rgba(0, 102, 255, 0.3);
      color: #fff;
    }
  `}</style>
);

// Navigation bar component
function Navbar() {
  const items = useCartStore((s) => s.items);
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  return (
    <nav
      dir="rtl"
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        left: 0,
        zIndex: 100,
        background: "rgba(10,10,15,0.92)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid rgba(0,102,255,0.15)`,
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 6%",
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: `linear-gradient(135deg, ${colors.blue[500]}, ${colors.orange[500]})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            fontWeight: 900,
            color: "#fff",
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          غ
        </div>
        <span
          style={{
            fontSize: "1.4rem",
            fontWeight: 900,
            color: colors.text.primary,
            fontFamily: "'Tajawal', sans-serif",
            letterSpacing: "-0.5px",
          }}
        >
          غياري
        </span>
      </Link>

      {/* Nav Links */}
      <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
        {[
          { href: "/products", label: "القطع" },
          { href: "/tuning", label: "تزويد نيسان" },
          { href: "/distributors", label: "الموزعون" },
        ].map((link) => (
          <Link
            key={link.href}
            to={link.href}
            style={{
              color: colors.text.secondary,
              textDecoration: "none",
              fontSize: "0.95rem",
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 500,
              transition: "color 0.2s",
            }}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Cart icon + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link
          to="/cart"
          style={{
            position: "relative",
            color: colors.text.secondary,
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
          }}
        >
          <ShoppingCart size={22} />
          {cartCount > 0 && (
            <span
              style={{
                position: "absolute",
                top: -8,
                left: -8,
                background: colors.orange[500],
                color: "#fff",
                borderRadius: "50%",
                width: 18,
                height: 18,
                fontSize: 11,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </Link>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: `linear-gradient(135deg, ${colors.orange[500]}, ${colors.orange.neon})`,
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 22px",
            fontSize: "0.9rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          ابحث عن قطعتك
        </motion.button>
      </div>
    </nav>
  );
}

// Features section
function FeaturesSection() {
  const features = [
    {
      icon: "🔧",
      titleAR: "تزويد نيسان فتك",
      descAR: "أكبر مجموعة قطع تزويد وأداء لنيسان باترول، GTR، 350Z في المملكة",
    },
    {
      icon: "🤖",
      titleAR: "رادار الذكاء الاصطناعي",
      descAR: "إذا مو لاقي قطعتك، اطلبها وراداراتنا الذكي يضيفها خلال أسبوعين",
    },
    {
      icon: "🚀",
      titleAR: "توصيل خلال 24-48 ساعة",
      descAR: "شبكة موزعين معتمدين في الرياض وجدة والدمام ودبي",
    },
    {
      icon: "🛡️",
      titleAR: "قطع أصلية مضمونة",
      descAR: "كل قطعة مضمونة الأصالة مع ضمان لمدة 12 شهر",
    },
  ];

  return (
    <section
      dir="rtl"
      style={{
        padding: "100px 6%",
        background: colors.background.secondary,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "64px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{
            display: "inline-block",
            background: "rgba(0,102,255,0.1)",
            border: "1px solid rgba(0,102,255,0.3)",
            borderRadius: "100px",
            padding: "6px 18px",
            color: colors.blue.neon,
            fontSize: "0.85rem",
            marginBottom: "20px",
            fontFamily: "'Tajawal', sans-serif",
          }}
        >
          ليش غياري؟
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          style={{
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
            fontWeight: 900,
            color: colors.text.primary,
            fontFamily: "'Tajawal', sans-serif",
            lineHeight: 1.3,
          }}
        >
          المنصة الأولى لعشاق السيارات
          <br />
          <span style={{ color: colors.orange[500] }}>في العالم العربي</span>
        </motion.h2>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "24px",
        }}
      >
        {features.map((f, i) => (
          <motion.div
            key={f.titleAR}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            style={{
              background: colors.background.tertiary,
              border: `1px solid rgba(255,255,255,0.06)`,
              borderRadius: "20px",
              padding: "36px 28px",
              cursor: "pointer",
              transition: "border-color 0.3s",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "16px" }}>{f.icon}</div>
            <h3
              style={{
                fontSize: "1.2rem",
                fontWeight: 800,
                color: colors.text.primary,
                marginBottom: "10px",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              {f.titleAR}
            </h3>
            <p
              style={{
                color: colors.text.secondary,
                lineHeight: 1.7,
                fontSize: "0.95rem",
                fontFamily: "'Tajawal', sans-serif",
              }}
            >
              {f.descAR}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <div>
      <Navbar />
      <HeroSection3D />
      <FeaturesSection />
      {/* Coming soon section */}
      <section
        dir="rtl"
        style={{
          padding: "80px 6%",
          background: colors.background.primary,
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: colors.gradients.carbonFiber,
            opacity: 0.5,
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ position: "relative", zIndex: 1 }}
        >
          <h2
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2.5rem)",
              fontWeight: 900,
              color: colors.text.primary,
              marginBottom: "16px",
              fontFamily: "'Tajawal', sans-serif",
            }}
          >
            جهزنا لك كل شيء
          </h2>
          <p
            style={{
              color: colors.text.secondary,
              fontSize: "1.1rem",
              marginBottom: "40px",
              fontFamily: "'Tajawal', sans-serif",
            }}
          >
            تواير · بريكات · بطاريات · تزويد نيسان · فتك · وأكثر من 20,000 قطعة
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            {["Brembo", "K&N", "HKS", "ARB", "Michelin", "Bosch", "Motul", "Defi"].map((brand) => (
              <span
                key={brand}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: colors.text.secondary,
                  fontSize: "0.9rem",
                  fontWeight: 600,
                }}
              >
                {brand}
              </span>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <GlobalStyle />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<CatalogPage />} />
          <Route path="/tuning" element={<CatalogPage />} />
          <Route path="/distributors" element={<div style={{ paddingTop: "80px", textAlign: "center", color: "#fff" }}>الموزعون - قريباً</div>} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrdersPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-left"
        toastOptions={{
          style: {
            background: colors.background.tertiary,
            color: colors.text.primary,
            border: `1px solid ${colors.carbon[600]}`,
            fontFamily: "'Tajawal', sans-serif",
            direction: "rtl",
          },
        }}
      />
    </QueryClientProvider>
  );
}
