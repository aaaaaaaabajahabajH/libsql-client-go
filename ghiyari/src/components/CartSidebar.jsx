import { Ic } from "./Icons";

// ════════════════════════════════════════════
// 🛒  CART SIDEBAR
// ════════════════════════════════════════════
export default function CartSidebar({ cart, lang, t, onRemove, onQty, onClose }) {
  const total = cart.reduce((s,i)=>s+(i.price*i.qty),0);
  const doCheckout = () => alert(lang==="ar"
    ? `🛒 جاري الانتقال لـ Shopify Checkout...\n\nالإجمالي: ${total} د.إ\n\n(في الإنتاج: صفحة دفع آمنة بـ Apple Pay / بطاقة)`
    : `🛒 Redirecting to Shopify Checkout...\n\nTotal: ${total} AED\n\n(In production: Secure payment with Apple Pay / Card)`);
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex" onClick={onClose}>
      <div className={`bg-white h-full w-full max-w-sm shadow-2xl flex flex-col ${lang==="ar"?"ms-auto":"me-auto"}`}
        onClick={e=>e.stopPropagation()}>
        <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
          <h2 className="text-lg font-black flex items-center gap-2"><Ic.Cart />{t.cart}</h2>
          <button onClick={onClose} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full transition-colors"><Ic.X /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length===0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-5xl mb-4">🛒</div><p>{t.emptyCart}</p>
            </div>
          ) : cart.map(item=>(
            <div key={item.id} className="bg-gray-50 rounded-2xl p-4 flex gap-3">
              <span className="text-3xl">{item.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{item.name[lang]}</p>
                <p className="text-blue-600 font-black mt-1">{item.price*item.qty} د.إ</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={()=>onQty(item.id,item.qty-1)} className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"><Ic.Minus /></button>
                  <span className="font-black w-6 text-center text-sm">{item.qty}</span>
                  <button onClick={()=>onQty(item.id,item.qty+1)} className="w-7 h-7 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors"><Ic.Plus /></button>
                  <button onClick={()=>onRemove(item.id)} className="ms-auto text-red-400 hover:text-red-600 transition-colors"><Ic.X /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {cart.length>0 && (
          <div className="p-4 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-600">{t.totalPrice}</span>
              <span className="text-2xl font-black text-blue-600">{total} <span className="text-base">د.إ</span></span>
            </div>
            <button onClick={doCheckout}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-base transition-colors active:scale-95">
              {t.checkout} →
            </button>
            <p className="text-xs text-gray-400 text-center">{t.shopifyNote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
