# غياري — Ghiyari Auto Parts Platform

## نظرة عامة
منصة قطع غيار سيارات رقمية للإمارات العربية المتحدة.
React + Vite + Tailwind CSS — بدون backend (Supabase جاهز للربط).

## أوامر التشغيل

```bash
npm install          # تثبيت التبعيات
npm run dev          # تشغيل خادم التطوير على http://localhost:5173
npm run build        # بناء نسخة الإنتاج
npm run preview      # معاينة نسخة الإنتاج
```

## هيكل المشروع

```
ghiyari/
├── CLAUDE.md              ← أنت هنا
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .env.example           ← انسخ إلى .env وأضف مفاتيح API
└── src/
    ├── main.jsx           ← نقطة الدخول
    ├── index.css          ← Tailwind CSS
    ├── App.jsx            ← التوجيه بين الصفحات + الحالة العامة (لغة، سلة، مودال)
    ├── components/        ← ProductCard, ProductModal, CartSidebar, AIChat,
    │                          Newsletter, AdminDash, Icons, DealersMap, DeliveryTracker
    ├── pages/              ← Home, Products, AIPage, Admin, Orders
    ├── services/           ← claude.js (Anthropic), maps.js (Google Maps)
    ├── hooks/              ← useCart.js
    ├── data/               ← mockData.js (PRODUCTS/DEALERS/STATS)
    └── i18n/               ← translations.js (AR/EN)
```

## التكاملات

| الخدمة | الحالة | ملاحظة |
|--------|--------|--------|
| Claude AI (Anthropic) | ✅ فعّال | `src/services/claude.js` → `callGhiyariAI()` |
| Google Maps | ✅ فعّال (يحتاج مفتاح) | `src/services/maps.js` + `DealersMap`/`DeliveryTracker`، مربوطة في صفحتي المنتجات والطلبات |
| Supabase | 🟡 Mock جاهز | استبدل `src/data/mockData.js` بـ Supabase client |
| Shopify | 🟡 Mock جاهز | استبدل `doCheckout()` في `CartSidebar` بـ Shopify Storefront API |
| Mailchimp | 🟡 Mock جاهز | استبدل `sub()` في `Newsletter` بـ Mailchimp API |

## متغيرات البيئة (.env)

```
VITE_ANTHROPIC_API_KEY=sk-ant-...      # مفتاح Claude AI
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SHOPIFY_STOREFRONT_TOKEN=...
VITE_SHOPIFY_STORE_DOMAIN=ghiyari.myshopify.com
VITE_MAILCHIMP_API_KEY=...
VITE_MAILCHIMP_LIST_ID=...
```

## التطوير القادم (Roadmap)

### 1. تجزئة الملفات (الأولوية الأولى) ✅ تمّت

### 2. ربط Supabase الحقيقي
```bash
npm install @supabase/supabase-js
```
```js
// src/services/supabase.js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
export const getProducts = () => supabase.from('products').select('*')
export const getDealers  = () => supabase.from('dealers').select('*')
```

### 3. ربط Shopify Storefront API
```bash
npm install @shopify/hydrogen-react
```

### 4. React Router للتنقل
```bash
npm install react-router-dom
```

### 5. حالة عالمية (Zustand)
```bash
npm install zustand
```

## Supabase Schema

```sql
-- المنتجات
create table products (
  id          uuid primary key default gen_random_uuid(),
  name_ar     text not null,
  name_en     text not null,
  category    text check (category in ('tires','brakes','batteries')),
  brand       text,
  price       numeric not null,
  compare_price numeric,
  rating      numeric default 0,
  reviews_count int default 0,
  stock       int default 0,
  dealer_id   uuid references dealers(id),
  icon        text,
  tags        text[],
  specs       jsonb,
  description_ar text,
  description_en text,
  sku         text unique,
  warranty_ar text,
  warranty_en text,
  created_at  timestamptz default now()
);

-- الموزعون
create table dealers (
  id          uuid primary key default gen_random_uuid(),
  name_ar     text not null,
  name_en     text not null,
  location_ar text,
  location_en text,
  rating      numeric default 0,
  total_sales int default 0,
  verified    boolean default false,
  tier        text check (tier in ('platinum','gold','silver')),
  certifications text[],
  phone       text,
  created_at  timestamptz default now()
);

-- الطلبات
create table orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  items       jsonb not null,
  total       numeric not null,
  status      text default 'pending',
  created_at  timestamptz default now()
);

-- RLS
alter table products enable row level security;
alter table dealers  enable row level security;
create policy "Public read" on products for select using (true);
create policy "Public read" on dealers  for select using (true);
```

## قواعد Claude Code

- **اللغة:** العربية في التعليقات والمتغيرات ذات الصلة بالمحتوى
- **الأسلوب:** Functional React + Hooks (لا class components)
- **التنسيق:** Tailwind CSS فقط — لا inline styles
- **الإصدار:** Node.js 18+ / React 18+
- **المتصفحات:** آخر إصدارات Chrome / Safari / Firefox
- **RTL:** دائماً `dir` ديناميكي حسب `lang`
- **لا تكسر:** منطق سلة التسوق، التبديل بين اللغتين، Claude AI integration

## Google Maps Integration

### الملفات
```
src/services/maps.js              ← Google Maps SDK loader + helpers
src/components/DealersMap.jsx     ← خريطة الموزعين التفاعلية
src/components/DeliveryTracker.jsx← تتبع التوصيل + مسار السائق
```

### APIs مفعّلة في Google Cloud
- Maps JavaScript API
- Places API
- Directions API
- Geocoding API
- Geometry Library

### الربط الحالي ✅
- `DealersMap` مربوطة في أسفل `src/pages/Products.jsx`
- `DeliveryTracker` مربوطة في `src/pages/Orders.jsx` (صفحة "الطلبات" الجديدة في شريط التنقل السفلي)
- بدون `VITE_GOOGLE_MAPS_API_KEY` في `.env`، تعرض المكوّنات حالة خطأ توضّح كيفية إضافة المفتاح بدلاً من كسر الصفحة

### إضافة الموزع الجديد
```js
// في src/components/DealersMap.jsx → DEALERS_GEO
{
  id: 'D005',
  name_ar: 'اسم الموزع',
  coords: { lat: 25.XXXX, lng: 55.XXXX },  // إحداثيات حقيقية
  tier: 'gold', // platinum / gold / silver
}
```
