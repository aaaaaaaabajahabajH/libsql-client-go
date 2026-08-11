import { Ic } from "./Icons";

// ════════════════════════════════════════════
// 🃏  PRODUCT CARD
// ════════════════════════════════════════════
export default function ProductCard({ p, lang, t, onAdd, onView, added }) {
  const disc = Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100);
  return (
    <div onClick={()=>onView(p)}
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 cursor-pointer transition-all duration-300 hover:-translate-y-1 group relative">
      {added && (
        <div className="absolute inset-0 bg-emerald-500/90 z-10 rounded-2xl flex items-center justify-center">
          <span className="text-white text-lg font-black">✓ {lang==="ar"?"أُضيف!":"Added!"}</span>
        </div>
      )}
      {/* Image area */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 group-hover:from-blue-50 group-hover:to-indigo-100 transition-all duration-300 p-8 h-40 flex items-center justify-center relative">
        <span className="text-6xl">{p.icon}</span>
        <div className="absolute top-2 start-2 flex flex-col gap-1">
          {disc>0 && <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">-{disc}%</span>}
          {p.tags.includes("bestseller") && <span className="bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">{t.bestseller}</span>}
          {p.tags.includes("original") && <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{t.original}</span>}
        </div>
        {p.stock<15 && <div className="absolute bottom-2 end-2 bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-semibold">{p.stock} {t.leftInStock}</div>}
      </div>
      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-2">{p.name[lang]}</h3>
        <div className="flex items-center gap-1 mb-3">
          <span className="text-amber-400"><Ic.Star /></span>
          <span className="text-sm font-bold text-gray-900">{p.rating}</span>
          <span className="text-xs text-gray-400">({p.reviews})</span>
          <span className={`ms-auto text-xs font-semibold ${p.stock>0?"text-emerald-600":"text-red-500"}`}>{p.stock>0?t.inStock:t.outOfStock}</span>
        </div>
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-xl font-black text-blue-600">{p.price}</span>
            <span className="text-xs text-gray-500 ms-1">د.إ</span>
            {p.comparePrice>p.price && <span className="text-xs text-gray-400 line-through ms-2">{p.comparePrice}</span>}
          </div>
        </div>
        <button onClick={e=>{e.stopPropagation();onAdd(p);}}
          className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold py-2.5 rounded-xl text-sm transition-all">
          {t.addToCart}
        </button>
      </div>
    </div>
  );
}
