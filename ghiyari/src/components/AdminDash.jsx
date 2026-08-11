import { useState } from "react";
import { Ic } from "./Icons";
import { PRODUCTS, DEALERS, STATS } from "../data/mockData";

// ════════════════════════════════════════════
// 📊  ADMIN DASHBOARD
// ════════════════════════════════════════════
export default function AdminDash({ lang, t }) {
  const [tab, setTab] = useState("overview");
  const cards = [
    {label:t.totalRevenue, val:`${STATS.totalRevenue.toLocaleString()} د.إ`, change:`+${STATS.monthlyGrowth}%`, icon:"💰"},
    {label:t.totalOrders, val:STATS.totalOrders.toLocaleString(), change:"+18%", icon:"📦"},
    {label:t.activeProducts, val:STATS.activeProducts, change:"+32", icon:"🛞"},
    {label:t.activeDealers, val:STATS.activeDealers, change:"+5", icon:"🏪"},
  ];
  const integrations = [
    {label:t.supabase, icon:"🗄️"}, {label:t.shopify, icon:"🛒"},
    {label:t.mailchimp, icon:"📧"}, {label:t.claude, icon:"🤖"},
  ];
  return (
    <div className="space-y-5">
      {/* Integrations */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <p className="font-bold text-gray-900 text-sm mb-3">🔗 {t.integrations}</p>
        <div className="grid grid-cols-2 gap-2">
          {integrations.map((item,i)=>(
            <div key={i} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
              <span>{item.icon}</span>
              <span className="text-xs font-semibold text-gray-700 flex-1">{item.label}</span>
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c,i)=>(
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className="text-2xl mb-2">{c.icon}</div>
            <p className="text-xl font-black text-gray-900">{c.val}</p>
            <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            <p className="text-xs text-emerald-600 font-bold mt-1">{c.change} {t.thisMonth}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          {["overview","dealers","productsList"].map(tb=>(
            <button key={tb} onClick={()=>setTab(tb)}
              className={`flex-1 py-3 text-xs font-bold transition-colors ${tab===tb?"text-blue-600 border-b-2 border-blue-600 bg-blue-50":"text-gray-500 hover:bg-gray-50"}`}>
              {t[tb]}
            </button>
          ))}
        </div>
        <div className="p-4">
          {tab==="overview" && (
            <div className="space-y-4">
              {[
                {label:t.convRate, val:`${STATS.conversionRate}%`, pct:STATS.conversionRate*10, color:"bg-blue-500"},
                {label:t.avgOrder, val:`${STATS.avgOrderValue} د.إ`, pct:70, color:"bg-indigo-500"},
                {label:t.satisfaction, val:`${STATS.satisfaction}%`, pct:STATS.satisfaction, color:"bg-emerald-500"},
              ].map((item,i)=>(
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-black text-gray-900">{item.val}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-1000`} style={{width:`${item.pct}%`}}/>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab==="dealers" && (
            <div className="space-y-3">
              {DEALERS.map(d=>(
                <div key={d.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base flex-shrink-0 ${d.tier==="platinum"?"bg-purple-100":"bg-amber-100"}`}>🏪</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{d.name[lang]}</p>
                    <p className="text-xs text-gray-500">{d.location[lang]}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-amber-500 text-xs flex items-center gap-0.5"><Ic.Star />{d.rating}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${d.tier==="platinum"?"bg-purple-100 text-purple-700":"bg-amber-100 text-amber-700"}`}>{d.tier}</span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 font-bold">{d.totalSales} {t.sales}</span>
                </div>
              ))}
            </div>
          )}
          {tab==="productsList" && (
            <div className="space-y-2">
              {PRODUCTS.map(p=>(
                <div key={p.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{p.name[lang]}</p>
                    <p className="text-xs text-gray-500">{p.price} د.إ • {lang==="ar"?`مخزون: ${p.stock}`:`Stock: ${p.stock}`}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
                    <Ic.Star />{p.rating}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
