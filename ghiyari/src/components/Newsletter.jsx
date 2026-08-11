import { useState } from "react";

// ════════════════════════════════════════════
// 📧  NEWSLETTER (Mailchimp)
// ════════════════════════════════════════════
export default function Newsletter({ lang, t }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const sub = async () => {
    if(!email.includes("@")) return;
    setLoading(true);
    await new Promise(r=>setTimeout(r,900)); // Mailchimp API hook
    setDone(true); setLoading(false);
  };
  return (
    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-3xl p-6">
      <p className="text-3xl mb-3">📧</p>
      <h3 className="text-lg font-black mb-1">{t.newsletter}</h3>
      <p className="text-blue-200 text-sm mb-4">{t.newsletterDesc}</p>
      {done ? (
        <div className="bg-white/20 rounded-2xl p-4 text-center font-bold">{t.subscribeOk}</div>
      ) : (
        <div className="flex gap-2">
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder={t.emailPlaceholder}
            className="flex-1 bg-white/20 border border-white/30 text-white placeholder-blue-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white/30"/>
          <button onClick={sub} disabled={loading}
            className="bg-white text-blue-700 font-black px-4 py-2.5 rounded-xl text-sm hover:bg-blue-50 transition-colors disabled:opacity-70">
            {loading?"...":t.subscribe}
          </button>
        </div>
      )}
      <p className="text-xs text-blue-300 mt-3">🔒 {lang==="ar"?"محمي بـ Mailchimp":"Protected by Mailchimp"}</p>
    </div>
  );
}
