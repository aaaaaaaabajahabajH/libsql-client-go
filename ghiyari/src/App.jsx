import { useState } from "react";
import { Ic } from "./components/Icons";
import CartSidebar from "./components/CartSidebar";
import ProductModal from "./components/ProductModal";
import Home from "./pages/Home";
import Products from "./pages/Products";
import AIPage from "./pages/AIPage";
import Admin from "./pages/Admin";
import Orders from "./pages/Orders";
import { useCart } from "./hooks/useCart";
import { T } from "./i18n/translations";

// ════════════════════════════════════════════
// 🏠  MAIN APP
// ════════════════════════════════════════════
export default function GhiyariApp() {
  const [lang, setLang] = useState("ar");
  const [page, setPage] = useState("home");
  const [cartOpen, setCartOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("all");
  const [brand, setBrand] = useState("all");
  const t = T[lang];

  const { cart, addedId, addToCart, removeFromCart, updateQty, cartCount } = useCart();

  const navItems = [
    {id:"home", icon:<Ic.Home />, label:t.home},
    {id:"products", icon:<Ic.Box />, label:t.products},
    {id:"orders", icon:<Ic.Truck />, label:t.orders},
    {id:"ai", icon:<Ic.Bot />, label:t.ai},
    {id:"admin", icon:<Ic.Settings />, label:t.admin},
  ];

  return (
    <div dir={lang==="ar"?"rtl":"ltr"} className="min-h-screen bg-gray-50 font-sans select-none">
      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={()=>setPage("home")} className="flex items-center gap-2">
            <span className="text-2xl font-black text-blue-600">{t.appName}</span>
            <span className="hidden sm:block text-xs text-gray-400 font-medium">{t.tagline}</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={()=>setLang(lang==="ar"?"en":"ar")}
              className="text-xs font-bold text-gray-600 px-3 py-1.5 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
              {lang==="ar"?"EN":"عر"}
            </button>
            <button onClick={()=>setCartOpen(true)}
              className="relative p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors active:scale-95">
              <Ic.Cart />
              {cartCount>0 && (
                <span className="absolute -top-1.5 -end-1.5 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-black">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-28">
        {page==="home" && (
          <Home lang={lang} t={t} setPage={setPage} setCat={setCat}
            addToCart={addToCart} setModal={setModal} addedId={addedId}/>
        )}
        {page==="products" && (
          <Products lang={lang} t={t} search={search} setSearch={setSearch}
            cat={cat} setCat={setCat} brand={brand} setBrand={setBrand}
            addToCart={addToCart} setModal={setModal} addedId={addedId}/>
        )}
        {page==="orders" && <Orders lang={lang} t={t}/>}
        {page==="ai" && <AIPage lang={lang} t={t}/>}
        {page==="admin" && <Admin lang={lang} t={t}/>}
      </main>

      {/* ── BOTTOM NAV ── */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-lg safe-area-pb">
        <div className="max-w-2xl mx-auto flex">
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setPage(item.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${page===item.id?"text-blue-600":"text-gray-400"}`}>
              <div className={`p-1.5 rounded-xl transition-all ${page===item.id?"bg-blue-100":""}`}>{item.icon}</div>
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── CART ── */}
      {cartOpen && <CartSidebar cart={cart} lang={lang} t={t} onRemove={removeFromCart} onQty={updateQty} onClose={()=>setCartOpen(false)}/>}

      {/* ── PRODUCT MODAL ── */}
      {modal && <ProductModal p={modal} lang={lang} t={t} onAdd={addToCart} onClose={()=>setModal(null)}/>}
    </div>
  );
}
