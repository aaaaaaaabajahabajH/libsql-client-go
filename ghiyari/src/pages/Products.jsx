import { Ic } from "../components/Icons";
import ProductCard from "../components/ProductCard";
import DealersMap from "../components/DealersMap";
import { PRODUCTS } from "../data/mockData";

// ════════════════════════════════════════════
// 🛍️  PRODUCTS PAGE
// ════════════════════════════════════════════
export default function Products({ lang, t, search, setSearch, cat, setCat, brand, setBrand, addToCart, setModal, addedId }) {
  const filtered = PRODUCTS.filter(p=>{
    const mc = cat==="all"||p.category===cat;
    const mb = brand==="all"||p.brand===brand;
    const ms = !search||p.name[lang].toLowerCase().includes(search.toLowerCase())||p.category.includes(search.toLowerCase());
    return mc&&mb&&ms;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gray-900">{t.products}</h1>
      {/* Search */}
      <div className="relative">
        <span className="absolute inset-y-0 start-4 flex items-center text-gray-400 pointer-events-none"><Ic.Search /></span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`${t.search}...`}
          className="w-full bg-white border border-gray-200 rounded-2xl ps-12 pe-4 py-3.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
      </div>
      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[{id:"all",label:t.all},{id:"tires",label:t.tires},{id:"brakes",label:t.brakes},{id:"batteries",label:t.batteries}].map(c=>(
          <button key={c.id} onClick={()=>setCat(c.id)}
            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${cat===c.id?"bg-blue-600 text-white shadow-md":"bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            {c.label}
          </button>
        ))}
      </div>
      {/* Brand filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {["all","toyota","nissan","lexus","bmw","mercedes"].map(b=>(
          <button key={b} onClick={()=>setBrand(b)}
            className={`px-3 py-1.5 rounded-full font-bold text-xs whitespace-nowrap border transition-all ${brand===b?"bg-gray-900 text-white border-gray-900":"bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}>
            {b==="all"?t.allBrands:b[0].toUpperCase()+b.slice(1)}
          </button>
        ))}
      </div>
      <p className="text-sm text-gray-500">{filtered.length} {t.available}</p>
      {filtered.length>0 ? (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map(p=>(
            <ProductCard key={p.id} p={p} lang={lang} t={t} onAdd={addToCart} onView={setModal} added={addedId===p.id}/>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-semibold">{lang==="ar"?"لا توجد منتجات مطابقة":"No products found"}</p>
        </div>
      )}

      {/* الموزعون على الخريطة */}
      <div className="pt-2 border-t border-gray-100">
        <DealersMap lang={lang} />
      </div>
    </div>
  );
}
