import AIChat from "../components/AIChat";

// ════════════════════════════════════════════
// 🤖  AI PAGE
// ════════════════════════════════════════════
export default function AIPage({ lang, t }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gray-900">🤖 {t.ai}</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden" style={{height:"calc(100vh - 240px)"}}>
        <AIChat lang={lang} t={t}/>
      </div>
    </div>
  );
}
