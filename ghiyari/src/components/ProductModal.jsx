import { Ic } from "./Icons";
import { DEALERS } from "../data/mockData";

// ════════════════════════════════════════════
// 🔍  PRODUCT DETAIL MODAL
// ════════════════════════════════════════════
export default function ProductModal({ p, lang, t, onAdd, onClose }) {
  const dealer = DEALERS.find(d=>d.id===p.dealer_id);
  const disc = Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100);
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-end p-4 pb-0">
          <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><Ic.X /></button>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-12 flex items-center justify-center">
          <span className="text-8xl">{p.icon}</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {disc>0 && <span className="bg-red-100 text-red-700 text-xs font-black px-3 py-1 rounded-full">-{disc}%</span>}
            {p.tags.includes("original") && <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full">{t.original}</span>}
            {p.tags.includes("bestseller") && <span className="bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">{t.bestseller}</span>}
          </div>
          <h2 className="text-2xl font-black text-gray-900">{p.name[lang]}</h2>
          <div className="flex items-center gap-2">
            <span className="text-amber-400 flex"><Ic.Star /></span>
            <span className="font-bold">{p.rating}</span>
            <span className="text-gray-500 text-sm">({p.reviews} {lang==="ar"?"تقييم":"reviews"})</span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">{p.description[lang]}</p>
          {/* Specs */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="font-bold text-gray-900 mb-3 text-sm">{t.specs}</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(p.specs).map(([k,v])=>(
                <div key={k} className="bg-white rounded-xl p-3">
                  <p className="text-xs text-gray-400">{k}</p>
                  <p className="text-sm font-bold text-gray-900">{v}</p>
                </div>
              ))}
            </div>
          </div>
          {/* Trust */}
          <div className="grid grid-cols-3 gap-2">
            {[
              {icon:<Ic.Truck />, label:lang==="ar"?"توصيل مجاني":"Free Delivery", bg:"bg-blue-50"},
              {icon:<Ic.Shield />, label:p.warranty[lang], bg:"bg-emerald-50"},
              {icon:"✅", label:t.verified, bg:"bg-amber-50"},
            ].map((b,i)=>(
              <div key={i} className={`${b.bg} rounded-2xl p-3 flex flex-col items-center gap-1 text-center`}>
                <div className="text-gray-600">{typeof b.icon==="string"?<span>{b.icon}</span>:b.icon}</div>
                <p className="text-xs text-gray-700 font-medium leading-tight">{b.label}</p>
              </div>
            ))}
          </div>
          {/* Dealer */}
          {dealer && (
            <div className="border border-gray-100 rounded-2xl p-4">
              <p className="font-bold text-gray-900 text-sm mb-1">🏪 {dealer.name[lang]}</p>
              <p className="text-xs text-gray-500 mb-2">📍 {dealer.location[lang]}</p>
              <div className="flex flex-wrap gap-1">
                {dealer.certs.map((c,i)=><span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c}</span>)}
              </div>
            </div>
          )}
          {/* Price + CTA */}
          <div className="flex items-center gap-4 pt-2">
            <div>
              <span className="text-4xl font-black text-blue-600">{p.price}</span>
              <span className="text-gray-500 ms-1">د.إ</span>
              {p.comparePrice>p.price && <p className="text-xs text-gray-400 line-through">{p.comparePrice} د.إ</p>}
            </div>
            <button onClick={()=>{onAdd(p);onClose();}}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-base transition-colors active:scale-95">
              {t.addToCart}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
