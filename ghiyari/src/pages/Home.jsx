import ProductCard from "../components/ProductCard";
import Newsletter from "../components/Newsletter";
import { PRODUCTS } from "../data/mockData";

// ════════════════════════════════════════════
// 🏠  HOME PAGE
// ════════════════════════════════════════════
export default function Home({ lang, t, setPage, setCat, addToCart, setModal, addedId }) {
  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white rounded-3xl p-7 relative overflow-hidden">
        <div className="absolute -top-4 -end-4 text-[120px] opacity-10 select-none">🚗</div>
        <span className="text-xs font-bold text-blue-300 bg-blue-900/50 px-3 py-1 rounded-full">🇦🇪 {lang==="ar"?"منصة الإمارات":"UAE Platform"}</span>
        <h1 className="text-3xl font-black mt-4 mb-3 leading-tight">
          {lang==="ar"?"قطع غيار أصلية\nبضغطة واحدة":"Original Spare Parts\nat Your Fingertips"}
        </h1>
        <p className="text-blue-300 text-sm mb-6">{lang==="ar"?"أسرع منصة لقطع غيار السيارات في الإمارات — موزعون معتمدون":"Fastest UAE auto parts platform — Certified dealers"}</p>
        <div className="flex gap-3">
          <button onClick={()=>setPage("products")} className="bg-blue-500 hover:bg-blue-400 text-white font-black px-5 py-2.5 rounded-xl text-sm transition-colors active:scale-95">
            {t.shopNow} →
          </button>
          <button onClick={()=>setPage("ai")} className="bg-white/15 hover:bg-white/25 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2">
            🤖 {t.askAI}
          </button>
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {id:"tires",icon:"🛞",label:t.tires,from:"from-blue-50",to:"to-blue-100",border:"border-blue-200"},
          {id:"brakes",icon:"🔴",label:t.brakes,from:"from-red-50",to:"to-red-100",border:"border-red-200"},
          {id:"batteries",icon:"🔋",label:t.batteries,from:"from-emerald-50",to:"to-emerald-100",border:"border-emerald-200"},
        ].map(c=>(
          <button key={c.id} onClick={()=>{setCat(c.id);setPage("products");}}
            className={`bg-gradient-to-br ${c.from} ${c.to} border ${c.border} rounded-2xl p-4 text-center hover:shadow-md active:scale-95 transition-all`}>
            <div className="text-3xl mb-2">{c.icon}</div>
            <p className="text-sm font-bold text-gray-800">{c.label}</p>
          </button>
        ))}
      </div>

      {/* Bestsellers */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-gray-900">{t.featuredProducts}</h2>
          <button onClick={()=>setPage("products")} className="text-blue-600 text-sm font-bold">{t.viewAll} →</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {PRODUCTS.filter(p=>p.tags.includes("bestseller")).map(p=>(
            <ProductCard key={p.id} p={p} lang={lang} t={t} onAdd={addToCart} onView={setModal} added={addedId===p.id}/>
          ))}
        </div>
      </div>

      {/* Newsletter */}
      <Newsletter lang={lang} t={t} />

      {/* Integration status */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <p className="text-sm font-black text-gray-900 mb-3">🔗 {t.integrations}</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            {label:"Supabase DB",note:lang==="ar"?"منتجات وموزعون":"Products & Dealers"},
            {label:"Shopify",note:lang==="ar"?"سلة ودفع":"Cart & Checkout"},
            {label:"Mailchimp",note:lang==="ar"?"حملات بريدية":"Email Campaigns"},
            {label:"Claude AI",note:lang==="ar"?"بحث ذكي":"Smart Search"},
          ].map((item,i)=>(
            <div key={i} className="flex items-center gap-2 p-2.5 bg-emerald-50 rounded-xl">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0"></span>
              <div className="min-w-0">
                <p className="text-xs font-black text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500 truncate">{item.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
