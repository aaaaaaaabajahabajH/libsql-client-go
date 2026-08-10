import AdminDash from "../components/AdminDash";

// ════════════════════════════════════════════
// 📊  ADMIN PAGE
// ════════════════════════════════════════════
export default function Admin({ lang, t }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">{t.admin}</h1>
        <span className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1 rounded-full">v2.0</span>
      </div>
      <AdminDash lang={lang} t={t}/>
    </div>
  );
}
