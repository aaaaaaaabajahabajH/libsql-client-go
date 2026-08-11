import { useState } from "react";

// ════════════════════════════════════════════
// 🛒  CART STATE
// ════════════════════════════════════════════
export function useCart() {
  const [cart, setCart] = useState([]);
  const [addedId, setAddedId] = useState(null);

  const addToCart = p => {
    setCart(prev=>{
      const ex=prev.find(i=>i.id===p.id);
      if(ex) return prev.map(i=>i.id===p.id?{...i,qty:i.qty+1}:i);
      return [...prev,{...p,qty:1}];
    });
    setAddedId(p.id);
    setTimeout(()=>setAddedId(null),1500);
  };
  const removeFromCart = id => setCart(prev=>prev.filter(i=>i.id!==id));
  const updateQty = (id,qty) => qty<=0 ? removeFromCart(id) : setCart(prev=>prev.map(i=>i.id===id?{...i,qty}:i));
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  return { cart, addedId, addToCart, removeFromCart, updateQty, cartCount };
}
