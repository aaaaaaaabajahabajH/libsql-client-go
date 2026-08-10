# 🚗 غياري — Ghiyari Auto Parts Platform

> منصة رقمية متكاملة لقطع غيار السيارات في الإمارات العربية المتحدة

---

## ⚡ تشغيل سريع

```bash
# طريقة 1: الإعداد التلقائي
bash setup.sh

# طريقة 2: يدوياً
npm install
cp .env.example .env   # ثم أضف مفاتيح API
npm run dev            # → http://localhost:5173
```

---

## 🔗 التكاملات

```
🤖 Claude AI    → src/services/claude.js :: callGhiyariAI()
🗺️ Google Maps  → src/services/maps.js + DealersMap / DeliveryTracker (مربوطة)
🗄️ Supabase     → src/data/mockData.js :: PRODUCTS / DEALERS (mock جاهز)
🛒 Shopify      → src/components/CartSidebar.jsx :: doCheckout()
📧 Mailchimp    → src/components/Newsletter.jsx :: sub()
```

---

## 📁 الملفات الرئيسية

| الملف | الغرض |
|-------|--------|
| `CLAUDE.md` | **اقرأه أولاً** — تعليمات Claude Code الكاملة |
| `src/App.jsx` | التوجيه بين الصفحات + الحالة العامة |
| `src/components/`, `src/pages/`, `src/services/`, `src/hooks/`, `src/data/`, `src/i18n/` | التطبيق مجزّأ إلى وحدات (انظر CLAUDE.md) |
| `.env.example` | قالب متغيرات البيئة |
| `setup.sh` | سكريبت الإعداد التلقائي |

---

## 🛠️ أوامر Claude Code المفيدة

```bash
# طلب تجزئة الكود إلى components
claude "جزّئ src/App.jsx إلى components منفصلة"

# طلب ربط Supabase الحقيقي
claude "اربط src/App.jsx مع Supabase باستخدام المتغيرات في .env"

# طلب إضافة React Router
claude "أضف React Router للتنقل بين الصفحات"

# طلب إضافة Zustand للحالة
claude "أضف Zustand لإدارة سلة التسوق بدلاً من useState"
```

---

## 📊 التقنيات

- **React 18** + **Vite 5**
- **Tailwind CSS 3** (RTL/LTR)
- **Anthropic Claude AI** (بحث ذكي)
- **Supabase** (قاعدة بيانات — جاهز للربط)
- **Shopify** (متجر ودفع — جاهز للربط)
- **Mailchimp** (تسويق — جاهز للربط)

---

## 🗺️ Roadmap

- [x] تجزئة `App.jsx` إلى components/pages/services/hooks
- [x] صفحة تتبع الطلبات (Orders) مربوطة بـ DeliveryTracker
- [x] ربط Google Maps (الموزعون + تتبع التوصيل)
- [ ] ربط Supabase الحقيقي
- [ ] ربط Shopify Storefront API
- [ ] إضافة React Router
- [ ] إضافة Zustand
- [ ] لوحة تحكم الموزع
- [ ] تطبيق موبايل (React Native)

---

*© 2024 Ghiyari — All rights reserved*
