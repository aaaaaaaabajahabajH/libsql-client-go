// ════════════════════════════════════════════
// 🗺️  DealersMap — خريطة الموزعين التفاعلية
// ════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, initMap, addDealerMarker, getUserLocation, calcDistance } from '../services/maps'

// بيانات الموزعين مع إحداثيات حقيقية
const DEALERS_GEO = [
  {
    id: 'D001',
    name_ar: 'مجموعة الإمارات لقطع الغيار',
    name_en: 'Emirates Auto Parts Group',
    location_ar: 'دبي — الراشدية',
    phone: '+971501234567',
    rating: 4.9,
    totalSales: 1250,
    tier: 'platinum',
    coords: { lat: 25.2285, lng: 55.3773 },
    hours: 'السبت–الخميس: 8ص–8م',
    whatsapp: '971501234567',
  },
  {
    id: 'D002',
    name_ar: 'الفخامة لقطع السيارات',
    name_en: 'Luxury Auto Parts',
    location_ar: 'أبو ظبي — المصفح',
    phone: '+971507654321',
    rating: 4.8,
    totalSales: 890,
    tier: 'gold',
    coords: { lat: 24.3629, lng: 54.5272 },
    hours: 'السبت–الخميس: 9ص–7م',
    whatsapp: '971507654321',
  },
  {
    id: 'D003',
    name_ar: 'بريميوم أوتو بارتس',
    name_en: 'Premium Auto Parts UAE',
    location_ar: 'الشارقة — المنطقة الصناعية',
    phone: '+971509876543',
    rating: 4.7,
    totalSales: 650,
    tier: 'gold',
    coords: { lat: 25.3462, lng: 55.4272 },
    hours: 'السبت–الخميس: 8ص–9م',
    whatsapp: '971509876543',
  },
  {
    id: 'D004',
    name_ar: 'دبي موتور بارتس',
    name_en: 'Dubai Motor Parts',
    location_ar: 'دبي — قرية التراث',
    phone: '+971551234567',
    rating: 4.6,
    totalSales: 420,
    tier: 'silver',
    coords: { lat: 25.1972, lng: 55.2744 },
    hours: 'السبت–الجمعة: 9ص–10م',
    whatsapp: '971551234567',
  },
]

const TIER_COLOR = { platinum: '#7C3AED', gold: '#D97706', silver: '#6B7280' }
const TIER_BG    = { platinum: 'bg-purple-100 text-purple-700', gold: 'bg-amber-100 text-amber-700', silver: 'bg-gray-100 text-gray-700' }

export default function DealersMap({ lang = 'ar' }) {
  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  const [selected,  setSelected]  = useState(null)
  const [distances, setDistances]  = useState({})
  const [loading,   setLoading]    = useState(true)
  const [error,     setError]      = useState(null)

  // تهيئة الخريطة
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await loadGoogleMaps()
        if (cancelled || !mapRef.current) return

        const userLoc = await getUserLocation()

        const map = await initMap(mapRef.current, {
          center: userLoc,
          zoom: 9,
        })
        mapInstance.current = map

        // إضافة Markers للموزعين
        for (const dealer of DEALERS_GEO) {
          await addDealerMarker(map, dealer)
        }

        // حساب المسافات
        if (window.google?.maps?.geometry) {
          const dists = {}
          DEALERS_GEO.forEach(d => {
            dists[d.id] = calcDistance(userLoc, d.coords)
          })
          if (!cancelled) setDistances(dists)
        }

        if (!cancelled) setLoading(false)
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
          setLoading(false)
        }
      }
    })()
    return () => { cancelled = true }
  }, [])

  // التركيز على موزع محدد
  const focusDealer = (dealer) => {
    setSelected(dealer)
    if (mapInstance.current) {
      mapInstance.current.panTo(dealer.coords)
      mapInstance.current.setZoom(14)
    }
  }

  const sortedDealers = [...DEALERS_GEO].sort((a, b) =>
    (parseFloat(distances[a.id]) || 999) - (parseFloat(distances[b.id]) || 999)
  )

  return (
    <div className="flex flex-col gap-4">
      {/* العنوان */}
      <div>
        <h2 className="text-2xl font-black text-gray-900">
          🗺️ {lang === 'ar' ? 'الموزعون المعتمدون' : 'Certified Dealers'}
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {lang === 'ar' ? `${DEALERS_GEO.length} موزعون في الإمارات` : `${DEALERS_GEO.length} dealers across UAE`}
        </p>
      </div>

      {/* الخريطة */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-md" style={{ height: 320 }}>
        <div ref={mapRef} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 font-semibold">
              {lang === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...'}
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center gap-3 p-6">
            <span className="text-4xl">🗺️</span>
            <p className="text-sm text-gray-600 text-center">
              {lang === 'ar'
                ? 'أضف VITE_GOOGLE_MAPS_API_KEY في .env لتفعيل الخريطة'
                : 'Add VITE_GOOGLE_MAPS_API_KEY in .env to enable the map'}
            </p>
            <code className="text-xs bg-gray-200 px-3 py-1 rounded-lg text-gray-700">
              VITE_GOOGLE_MAPS_API_KEY=AIza...
            </code>
          </div>
        )}

        {/* Legend */}
        {!loading && !error && (
          <div className="absolute bottom-3 start-3 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow text-xs flex flex-col gap-1">
            {Object.entries(TIER_COLOR).map(([tier, color]) => (
              <div key={tier} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-gray-700 capitalize">{tier}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* قائمة الموزعين */}
      <div className="space-y-3">
        {sortedDealers.map((dealer) => (
          <button key={dealer.id}
            onClick={() => focusDealer(dealer)}
            className={`w-full text-start bg-white rounded-2xl p-4 border-2 transition-all shadow-sm hover:shadow-md ${
              selected?.id === dealer.id ? 'border-blue-500' : 'border-gray-100'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* أيقونة */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: TIER_COLOR[dealer.tier] + '20' }}>
                🏪
              </div>

              {/* المعلومات */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-black text-gray-900 text-sm">{dealer.name_ar}</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${TIER_BG[dealer.tier]}`}>
                    {dealer.tier}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">📍 {dealer.location_ar}</p>
                <p className="text-xs text-gray-400 mt-0.5">🕐 {dealer.hours}</p>

                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-amber-600 font-bold">⭐ {dealer.rating}</span>
                  <span className="text-xs text-gray-400">{dealer.totalSales} {lang === 'ar' ? 'مبيعة' : 'sales'}</span>
                  {distances[dealer.id] && (
                    <span className="text-xs text-blue-600 font-bold ms-auto">
                      📍 {distances[dealer.id]} كم
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* أزرار التواصل (تظهر عند الاختيار) */}
            {selected?.id === dealer.id && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                <a href={`tel:${dealer.phone}`}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-xl text-center">
                  📞 {lang === 'ar' ? 'اتصل' : 'Call'}
                </a>
                <a href={`https://wa.me/${dealer.whatsapp}`}
                  target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-emerald-500 text-white text-xs font-bold py-2 rounded-xl text-center">
                  💬 WhatsApp
                </a>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${dealer.coords.lat},${dealer.coords.lng}`}
                  target="_blank" rel="noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="flex-1 bg-gray-100 text-gray-700 text-xs font-bold py-2 rounded-xl text-center">
                  🧭 {lang === 'ar' ? 'اتجاهات' : 'Directions'}
                </a>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
