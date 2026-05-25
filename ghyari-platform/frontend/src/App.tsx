import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import HeroSection3D from "./components/HeroSection3D";
import { colors } from "./theme/colors";

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

function HomePage() {
  return (
    <div>
      <HeroSection3D />
      {/* Additional sections will be added here */}
      <section
        style={{
          padding: "80px 6%",
          background: colors.background.secondary,
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontSize: "2rem",
            fontWeight: 800,
            color: colors.text.primary,
            marginBottom: "16px",
          }}
        >
          قريباً — المنصة الأولى لعشاق السيارات
        </h2>
        <p style={{ color: colors.text.secondary, fontSize: "1.1rem" }}>
          تواير · بريكات · بطاريات · تزويد نيسان · فتك · وأكثر
        </p>
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
          <Route path="/products" element={<div>Products Page</div>} />
          <Route path="/tuning" element={<div>Tuning/Performance Page</div>} />
          <Route path="/distributors" element={<div>Distributors Page</div>} />
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
