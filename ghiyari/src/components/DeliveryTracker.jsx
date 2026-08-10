// ════════════════════════════════════════════
// 🚚  DeliveryTracker — تتبع التوصيل
// ════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'
import { loadGoogleMaps, initMap, renderRoute, getUserLocation } from '../services/maps'

// مراحل التوصيل
const STAGES = {
  ar: [
    { id: 'confirmed', label: 'تم تأكيد الطلب',  icon: '✅', done: true  },
    { id: 'prepared',  label: 'جاري التحضير',     icon: '📦', done: true  },
    { id: 'picked',    label: 'تم الاستلام من الموزع', icon: '🏪', done: true  },
    { id: 'transit',   label: 'في الطريق إليك',   icon: '🚚', done: false, active: true },
    { id: 'delivered', label: 'تم التوصيل',        icon: '🎉', done: false },
  ],
  en: [
    { id: 'confirmed', label: 'Order Confirmed',   icon: '✅', done: true  },
    { id: 'prepared',  label: 'Preparing Order',   icon: '📦', done: true  },
    { id: 'picked',    label: 'Picked from Dealer',icon: '🏪', done: true  },
    { id: 'transit',   label: 'On the Way',        icon: '🚚', done: false, active: true },
    { id: 'delivered', label: 'Delivered',         icon: '🎉', done: false },
  ],
}

// طلب نموذجي للعرض
const MOCK_ORDER = {
  id: 'ORD-2024-0042',
  product: { ar: 'إطار تويوتا كامري 225/55R17', en: 'Toyota Camry Tire 225/55R17' },
  dealer:  { ar: 'مجموعة الإمارات لقطع الغيار', en: 'Emirates Auto Parts Group' },
  dealerCoords: { lat: 25.2285, lng: 55.3773 },
  eta: '45',
  driver: { name: 'محمد الشمري', phone: '+971551234567', rating: 4.9 },
}

// eslint-disable-next-line no-unused-vars -- orderId is reserved for wiring up real order lookups
export default function DeliveryTracker({ lang = 'ar', orderId }) {
  const mapRef      = useRef(null)
  const mapInstance = useRef(null)
  const driverRef   = useRef(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [routeInfo, setRouteInfo] = useState(null)
  const [eta,       setEta]       = useState(MOCK_ORDER.eta)

  useEffect(() => {
    let cancelled = false
    let interval  = null
    ;(async () => {
      try {
        await loadGoogleMaps()
        if (cancelled || !mapRef.current) return

        const userLoc = await getUserLocation()

        const map = await initMap(mapRef.current, {
          center: {
            lat: (userLoc.lat + MOCK_ORDER.dealerCoords.lat) / 2,
            lng: (userLoc.lng + MOCK_ORDER.dealerCoords.lng) / 2,
          },
          zoom: 10,
        })
        mapInstance.current = map

        // رسم المسار
        const route = await renderRoute(
          map,
          MOCK_ORDER.dealerCoords,
          userLoc
        )
        if (!cancelled) {
          setRouteInfo(route)
          setLoading(false)
        }

        // تحريك السائق (محاكاة)
        const maps = window.google.maps
        const driverMarker = new maps.Marker({
          position: MOCK_ORDER.dealerCoords,
          map,
          title: MOCK_ORDER.driver.name,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="18" fill="#2563EB" stroke="white" stroke-width="3"/>
                <text y="26" x="20" text-anchor="middle" font-size="18">🚚</text>
              </svg>
            `),
            scaledSize: new maps.Size(40, 40),
          },
          zIndex: 999,
        })
        driverRef.current = driverMarker

        // محاكاة تحرك السائق
        let step = 0
        const totalSteps = 20
        interval = setInterval(() => {
          if (cancelled) { clearInterval(interval); return }
          step++
          const progress = step / totalSteps
          const newLat = MOCK_ORDER.dealerCoords.lat + (userLoc.lat - MOCK_ORDER.dealerCoords.lat) * progress
          const newLng = MOCK_ORDER.dealerCoords.lng + (userLoc.lng - MOCK_ORDER.dealerCoords.lng) * progress
          const newPos = { lat: newLat, lng: newLng }
          driverMarker.setPosition(newPos)
          setEta(Math.max(2, Math.round(parseInt(MOCK_ORDER.eta) * (1 - progress))).toString())
          if (step >= totalSteps) clearInterval(interval)
        }, 3000)

      } catch (e) {
        if (!cancelled) { setError(e.message); setLoading(false) }
      }
    })()
    return () => { cancelled = true; if (interval) clearInterval(interval) }
  }, [])

  const stages = STAGES[lang]

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-blue-200 text-xs font-semibold mb-1">
              {lang === 'ar' ? 'تتبع طلبك' : 'Track Your Order'}
            </p>
            <p className="font-black text-lg">{MOCK_ORDER.id}</p>
            <p className="text-blue-200 text-sm mt-1 leading-snug">{MOCK_ORDER.product[lang]}</p>
          </div>
          <div className="text-center bg-white/20 rounded-xl px-4 py-3">
            <p className="text-3xl font-black">{eta}</p>
            <p className="text-xs text-blue-200">{lang === 'ar' ? 'دقيقة' : 'min'}</p>
          </div>
        </div>
      </div>

      {/* مراحل التوصيل */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center justify-between relative">
          {/* خط التقدم */}
          <div className="absolute start-0 end-0 h-0.5 bg-gray-100 top-5 mx-8 z-0">
            <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: '60%' }} />
          </div>
          {stages.map((stage) => (
            <div key={stage.id} className="flex flex-col items-center gap-1.5 z-10">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                stage.done   ? 'bg-blue-600 shadow-md shadow-blue-200' :
                stage.active ? 'bg-blue-100 ring-2 ring-blue-500 ring-offset-1 animate-pulse' :
                               'bg-gray-100'
              }`}>
                {stage.icon}
              </div>
              <p className={`text-[10px] font-bold text-center leading-tight w-16 ${
                stage.done ? 'text-blue-600' : stage.active ? 'text-blue-600' : 'text-gray-400'
              }`}>{stage.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* الخريطة */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-100 shadow-md" style={{ height: 280 }}>
        <div ref={mapRef} className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 font-semibold">
              {lang === 'ar' ? 'جاري تحميل الخريطة...' : 'Loading map...'}
            </p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center gap-2 p-4">
            <span className="text-4xl">🚚</span>
            <p className="text-xs text-gray-500 text-center">
              {lang === 'ar' ? 'أضف Google Maps API Key في .env' : 'Add Google Maps API Key in .env'}
            </p>
          </div>
        )}

        {/* معلومات المسار */}
        {routeInfo && (
          <div className="absolute top-3 end-3 bg-white/95 backdrop-blur rounded-xl px-3 py-2 shadow text-xs space-y-1">
            <p className="font-black text-gray-900">⏱ {routeInfo.duration}</p>
            <p className="text-gray-500">📏 {routeInfo.distance}</p>
          </div>
        )}
      </div>

      {/* بطاقة السائق */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">🚚</div>
        <div className="flex-1">
          <p className="font-black text-gray-900 text-sm">{MOCK_ORDER.driver.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-amber-500 font-bold">⭐ {MOCK_ORDER.driver.rating}</span>
            <span className="text-xs text-gray-400">{lang === 'ar' ? 'سائق معتمد' : 'Certified Driver'}</span>
          </div>
        </div>
        <a href={`tel:${MOCK_ORDER.driver.phone}`}
          className="bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
          📞 {lang === 'ar' ? 'اتصل' : 'Call'}
        </a>
      </div>
    </div>
  )
}
