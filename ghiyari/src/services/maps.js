// ════════════════════════════════════════════
// 🗺️  Google Maps Service — غياري
// Project: project-fc665c2c-22d9-477b-8de
// ════════════════════════════════════════════

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// ── تحميل Google Maps SDK ──────────────────
let mapsPromise = null

export const loadGoogleMaps = () => {
  if (mapsPromise) return mapsPromise

  mapsPromise = new Promise((resolve, reject) => {
    if (window.google?.maps) return resolve(window.google.maps)

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,geometry&language=ar&region=AE`
    script.async = true
    script.defer = true
    script.onload  = () => resolve(window.google.maps)
    script.onerror = () => reject(new Error('فشل تحميل Google Maps'))
    document.head.appendChild(script)
  })

  return mapsPromise
}

// ── حساب المسافة بين نقطتين ───────────────
export const calcDistance = (from, to) => {
  if (!window.google?.maps) return null
  const fromLatLng = new window.google.maps.LatLng(from.lat, from.lng)
  const toLatLng   = new window.google.maps.LatLng(to.lat,   to.lng)
  const meters = window.google.maps.geometry.spherical.computeDistanceBetween(fromLatLng, toLatLng)
  return (meters / 1000).toFixed(1) // كيلومتر
}

// ── تحويل العنوان إلى إحداثيات ─────────────
export const geocodeAddress = async (address) => {
  const maps = await loadGoogleMaps()
  const geocoder = new maps.Geocoder()
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address, region: 'AE' }, (results, status) => {
      if (status === 'OK') resolve(results[0].geometry.location)
      else reject(new Error(`Geocoding failed: ${status}`))
    })
  })
}

// ── حساب مسار التوصيل ─────────────────────
export const getDirections = async (origin, destination) => {
  const maps = await loadGoogleMaps()
  const directionsService = new maps.DirectionsService()
  return new Promise((resolve, reject) => {
    directionsService.route(
      {
        origin,
        destination,
        travelMode: maps.TravelMode.DRIVING,
        unitSystem: maps.UnitSystem.METRIC,
      },
      (result, status) => {
        if (status === 'OK') resolve(result)
        else reject(new Error(`Directions failed: ${status}`))
      }
    )
  })
}

// ── الحصول على موقع المستخدم ──────────────
export const getUserLocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('المتصفح لا يدعم تحديد الموقع'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => resolve({ lat: 25.2048, lng: 55.2708 }) // Dubai fallback
    )
  })

// ── إعداد الخريطة ─────────────────────────
export const initMap = async (container, options = {}) => {
  const maps = await loadGoogleMaps()
  return new maps.Map(container, {
    center:          options.center || { lat: 25.2048, lng: 55.2708 },
    zoom:            options.zoom   || 10,
    mapTypeId:       'roadmap',
    mapId:           'ghiyari-map',
    disableDefaultUI: false,
    gestureHandling: 'greedy',
    styles: [
      { featureType:'poi', stylers:[{ visibility:'off' }] },
      { featureType:'transit', stylers:[{ visibility:'off' }] },
    ],
    ...options,
  })
}

// ── إضافة Marker للموزع ───────────────────
export const addDealerMarker = async (map, dealer) => {
  const maps = await loadGoogleMaps()
  const tierColor = { platinum:'#7C3AED', gold:'#D97706', silver:'#6B7280' }

  const marker = new maps.Marker({
    position: dealer.coords,
    map,
    title:    dealer.name_ar,
    icon: {
      path: maps.SymbolPath.CIRCLE,
      scale:       12,
      fillColor:   tierColor[dealer.tier] || '#2563EB',
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
    },
  })

  const infoWindow = new maps.InfoWindow({
    content: `
      <div style="font-family:system-ui;direction:rtl;padding:8px;min-width:200px">
        <p style="font-weight:900;font-size:14px;margin:0 0 4px">${dealer.name_ar}</p>
        <p style="color:#6b7280;font-size:12px;margin:0 0 6px">📍 ${dealer.location_ar}</p>
        <p style="color:#6b7280;font-size:12px;margin:0 0 6px">⭐ ${dealer.rating} • ${dealer.totalSales} مبيعة</p>
        <span style="background:${tierColor[dealer.tier]};color:#fff;font-size:11px;padding:2px 8px;border-radius:999px">${dealer.tier}</span>
        <br><br>
        <a href="tel:${dealer.phone}" style="color:#2563eb;font-size:12px">📞 ${dealer.phone}</a>
      </div>
    `,
  })

  marker.addListener('click', () => infoWindow.open(map, marker))
  return { marker, infoWindow }
}

// ── رسم مسار التوصيل على الخريطة ──────────
export const renderRoute = async (map, origin, destination) => {
  const maps   = await loadGoogleMaps()
  const result = await getDirections(origin, destination)

  const renderer = new maps.DirectionsRenderer({
    map,
    suppressMarkers: false,
    polylineOptions: {
      strokeColor:   '#2563EB',
      strokeWeight:  4,
      strokeOpacity: 0.8,
    },
  })
  renderer.setDirections(result)
  return {
    renderer,
    duration: result.routes[0].legs[0].duration.text,
    distance: result.routes[0].legs[0].distance.text,
  }
}
