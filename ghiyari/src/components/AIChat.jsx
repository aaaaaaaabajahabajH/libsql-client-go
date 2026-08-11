import { useState, useEffect, useRef } from "react";
import { Ic } from "./Icons";
import { callGhiyariAI } from "../services/claude";

// ════════════════════════════════════════════
// 🤖  AI CHAT
// ════════════════════════════════════════════
export default function AIChat({ lang, t }) {
  const [msgs, setMsgs] = useState([{ role:"assistant", content:t.aiWelcome }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); },[msgs]);

  const quickQs = lang==="ar"
    ? ["ما الإطار المناسب لتويوتا كامري؟","متى أغير البطارية؟","براكات أصلية أم بديلة؟","عروض اليوم"]
    : ["Best tire for Toyota Camry?","When to replace battery?","OEM vs aftermarket brakes?","Today's deals"];

  const send = async () => {
    if(!input.trim()||loading) return;
    const q = input.trim();
    setInput("");
    const newMsgs = [...msgs, {role:"user",content:q}];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const reply = await callGhiyariAI(
        newMsgs.map(m=>({role:m.role,content:m.content})), lang
      );
      setMsgs(prev=>[...prev,{role:"assistant",content:reply}]);
    } catch(e) {
      setMsgs(prev=>[...prev,{role:"assistant",content:lang==="ar"?"⚠️ خطأ في الاتصال. تحقق من الإنترنت وحاول مجدداً.":"⚠️ Connection error. Please try again."}]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* AI Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">🤖</div>
          <div className="flex-1">
            <p className="font-black text-white">{lang==="ar"?"مساعد غياري الذكي":"Ghiyari AI Assistant"}</p>
            <p className="text-xs text-blue-200">{lang==="ar"?"مدعوم بـ Claude AI الحقيقي":"Powered by Real Claude AI"}</p>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            {lang==="ar"?"متصل":"Live"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3 min-h-0">
        {msgs.map((m,i)=>(
          <div key={i} className={`flex ${m.role==="user"?"justify-end":"justify-start"} items-end gap-2`}>
            {m.role==="assistant" && <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">🤖</div>}
            <div className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
              m.role==="user"
                ? "bg-blue-600 text-white rounded-2xl rounded-ee-sm"
                : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-2xl rounded-es-sm"
            }`}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">🤖</div>
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
              <div className="flex gap-1">
                {[0,150,300].map(d=><span key={d} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:`${d}ms`}}></span>)}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef}/>
      </div>

      {/* Quick questions */}
      {msgs.length<=2 && (
        <div className="bg-gray-50 border-t border-gray-100 p-3 flex gap-2 overflow-x-auto">
          {quickQs.map((q,i)=>(
            <button key={i} onClick={()=>setInput(q)}
              className="text-xs bg-white border border-blue-200 text-blue-700 px-3 py-2 rounded-full whitespace-nowrap hover:bg-blue-50 flex-shrink-0 transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100 rounded-b-2xl">
        <div className="flex gap-2">
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()}
            placeholder={t.aiPlaceholder} disabled={loading}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"/>
          <button onClick={send} disabled={loading||!input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2.5 rounded-xl transition-colors active:scale-95">
            <Ic.Send />
          </button>
        </div>
      </div>
    </div>
  );
}
