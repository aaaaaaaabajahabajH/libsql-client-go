# وثيقة توثيق مشروع غياري (Ghyari) الشاملة
## Ghyari Platform — Full Project Documentation Specification

**الإصدار:** 1.0.0
**آخر تحديث:** أغسطس 2026
**الحالة:** وثيقة مرجعية حية — يجب تحديثها مع كل تغيير جوهري في البنية أو الموارد

> هذه الوثيقة هي المرجع المركزي لمشروع **غياري**، منصة قطع غيار السيارات العربية. تجمع الرؤية، البنية التقنية، سجل الموارد والروابط، خريطة الميزات، ودليل التشغيل في مكان واحد بدلاً من تشتتها بين عدة ملفات. الوثائق التفصيلية القائمة (`ARCHITECTURE.md`, `PRODUCT_STRATEGY.md`, `AI_RADAR_SPEC.md`, `ROADMAP.md`, `DATABASE_SCHEMA.sql`) لا تزال المرجع العميق لكل موضوع — هذه الوثيقة تربط بينها وتلخصها بصيغة تنفيذية.

---

## 1. النظرة العامة والرؤية | Project Overview

### 1.1 ملخص المشروع

**غياري (Ghyari)** منصة تجارة إلكترونية متخصصة في قطع غيار السيارات موجهة للسوق العربي (السعودية ودول الخليج تحديداً)، تجمع بين:

- كتالوج قطع استهلاكية سريعة (تواير، بطاريات، فلاتر، زيوت، بريكات).
- محور متخصص في **تزويد وأداء نيسان** (Nissan tuning) — قطع أداء وتعليق وعوادم للسيارات ذات الطابع الرياضي/الكلاسيكي (Patrol Y62, GT-R R35, 350Z/370Z, Skyline).
- **الرادار الذكي (AI Radar)**: نظام يعتمد على Claude API لرصد طلبات العملاء التي لا تجد نتائج، وتحويلها إلى إشارات طلب واقتراحات مخزون تلقائية.
- شبكة موزعين محليين معتمدين (الرياض، جدة، الدمام) بدل الاعتماد على مخزون مركزي واحد.
- تجربة بصرية ثلاثية الأبعاد (Three.js / React Three Fiber) بهوية لونية مميزة (أسود عميق + أزرق كهربائي + برتقالي نيون).

### 1.2 الهدف الأساسي

سد فجوة في سوق قطع الغيار العربي حيث تنتشر المحلات المتفرقة وسوء تجربة البحث، عبر منصة موحّدة، عربية أولاً (Arabic-first, RTL)، تربط العميل مباشرة بالموزع الأقرب والأنسب سعراً، وتتعلم من الطلبات غير الملباة لتوسيع الكتالوج تلقائياً بدل الانتظار لتحليل يدوي.

### 1.3 الجمهور المستهدف

| الشريحة | الوصف |
|---|---|
| مالكو السيارات (عامة) | قطع استهلاكية سريعة — تواير، بطاريات، فلاتر، زيوت |
| هواة التعديل والأداء | مجتمع نيسان تفتيش/تزويد (GT-R, Patrol, 350Z/370Z, Skyline) |
| الموزعون ومحلات القطع | شركاء بيع يديرون كتالوجهم ومخزونهم عبر بوابة الموزعين |
| فريق التشغيل الداخلي | لوحة تحكم إدارية لمراجعة الطلبات، الرادار الذكي، والموزعين |

### 1.4 القيمة المضافة

- **لا حاجة للاتصال بعدة محلات** — بحث موحّد بالتوافق مع طراز السيارة.
- **الرادار الذكي يحوّل "غير متوفر" إلى فرصة**: كل بحث بلا نتيجة يُغذّي تحليل Claude لاقتراح توسيع الكتالوج.
- **تخصص عميق في تعديل نيسان** بدل التعميم على كل الماركات، يبني ثقة مجتمع متخصص.
- **تجربة عربية RTL كاملة** بدل واجهات مترجمة آلياً من الإنجليزية.
- **مرونة السداد المحلي** (Mada, STCPay, Tabby BNPL) بدل الاعتماد على بطاقات دولية فقط.

---

## 2. الهيكلية البرمجية والربط | Architecture & Directory Structure

> المرجع التفصيلي: [`docs/ARCHITECTURE.md`](./ARCHITECTURE.md) (المخطط الكامل للخدمات ونقاط النهاية).

### 2.1 نظرة معمارية عالية المستوى

المنصة عبارة عن خدمات موزّعة منطقياً داخل تطبيق Go واحد (وليس microservices منفصلة فعلياً حالياً) + عامل AI مستقل + واجهة React:

```
عميل (React + Three.js, RTL عربي)
        │
        ▼
   Nginx (reverse proxy, TLS)
        │
        ▼
  Go API (Gin) ── Auth (JWT) ── Rate limiting ── CORS
        │
        ├── Products / Categories / Cars   (كتالوج + توافق السيارات)
        ├── Cart / Orders                  (محمية بمصادقة)
        ├── Distributors                    (موزعون وشركاء)
        ├── AI Radar                        (طلبات العملاء + توصيات)
        ├── Admin                           (منتجات، رادار، موزعون، طلبات، رفع ملفات)
        │
        ▼
  libsql / Turso (قاعدة بيانات SQL موزعة)
        │
        ├── Redis (كاش + طابور لعامل الرادار)
        ├── AI Radar Worker (Go) ── Anthropic Claude API
        └── Google Cloud Storage (تخزين الصور/الأصول)
```

### 2.2 هيكلة المجلدات

```
ghyari-platform/
├── backend/                 # Go + Gin REST API (module: github.com/ghyari/api, Go 1.23)
│   ├── main.go               # نقطة الدخول: DB، migrations/seed، routes، middleware
│   └── internal/
│       ├── db/                # الاتصال، الترحيلات (migrations)، البذر (seed)
│       ├── handlers/           # منطق كل نقطة نهاية (products, orders, ai, ...)
│       ├── middleware/          # JWT auth، أدوار (RequireRole)
│       └── storage/             # رفع الملفات إلى GCS
│
├── ai-engine/                # عامل مستقل (module: github.com/ghyari/ai-engine)
│                              # يستدعي Claude API لتحليل إشارات الطلب، دورة كل SCAN_INTERVAL ثانية
│
├── frontend/                 # React 18 + TypeScript + Vite
│   └── src/                   # مكونات ثلاثية الأبعاد (@react-three/fiber)، i18n عربي/إنجليزي (react-i18next)، RTL
│
├── infrastructure/
│   ├── docker-compose.yml     # api + frontend + redis + ai-radar + nginx
│   ├── nginx.conf
│   └── gcloud/                 # مواصفات Cloud Run + إعداد Cloud Build
│
├── docs/                      # هذه الوثيقة + ARCHITECTURE / PRODUCT_STRATEGY / AI_RADAR_SPEC / ROADMAP / DATABASE_SCHEMA
├── scripts/                   # deploy.sh، setup-gcloud.sh، seed_data.sql
└── .env.example               # كل متغيرات البيئة موثّقة بالعربية داخل الملف نفسه
```

كلا الموديولين (`backend`, `ai-engine`) يستخدمان `replace github.com/tursodatabase/libsql-client-go => ../../` للاعتماد على سائق libsql المحلي في هذا المستودع مباشرة دون إصدار نسخة منشورة.

### 2.3 حزمة التقنيات ومبررات الاختيار

| الطبقة | التقنية | لماذا |
|---|---|---|
| الواجهة الخلفية | Go + Gin | أداء عالٍ، إنتاجية جيدة لواجهات REST، نظام middleware ناضج، ونفس اللغة المستخدمة في سائق libsql مما يسمح بربط مباشر بدون طبقة وسيطة |
| قاعدة البيانات | libsql / Turso | متوافقة SQLite لكنها موزعة (edge replicas)، تقلل زمن الاستجابة لعملاء الخليج، وتُستخدم عبر سائق هذا المستودع نفسه |
| الواجهة الأمامية | React 18 + TypeScript + Vite | نظام مكونات ناضج + بناء سريع + دعم قوي لـ TypeScript لتقليل الأخطاء |
| العرض ثلاثي الأبعاد | Three.js + @react-three/fiber + drei | مطلوب لعرض قطع الأداء/السيارات بشكل تفاعلي يميّز المنصة عن المتاجر التقليدية |
| التدويل | react-i18next + RTL | المنصة عربية أولاً مع دعم إنجليزي، ودعم RTL أصيل بدل حلول ترقيعية |
| الذكاء الاصطناعي | Anthropic Claude API | تحليل النصوص العربية لطلبات العملاء واستخراج إشارات طلب واقتراحات مخزون |
| الكاش/الطابور | Redis | كاش الاستعلامات المتكررة وتنسيق دورات عامل الرادار الذكي |
| التخزين | Google Cloud Storage | تخزين صور المنتجات والأصول ثلاثية الأبعاد مع CDN اختياري |
| البنية التحتية | Docker Compose (محلي) / Cloud Run (إنتاج) | Compose يبسط التشغيل المحلي؛ Cloud Run يوفر توسعاً تلقائياً بدون إدارة خوادم |
| المصادقة | JWT + أدوار (admin/user) | تجزئة صلاحيات بسيطة تكفي لمرحلة المنتج الحالية دون تعقيد OAuth كامل |

---

## 3. سجل المواقع والمصادر المرتبطة | Resource & URL Directory

> ⚠️ لا تضع أي مفاتيح API أو أسرار فعلية في هذا الملف — فقط الروابط، أسماء الموارد، ومكان تخزين السر (مثال: "GitHub Secrets" أو "GCP Secret Manager"). القيم الفعلية تُدار حصراً عبر `.env` المحلي أو مدير الأسرار السحابي.

### 3.1 بيئات التشغيل (Development / Staging / Production)

| البيئة | الرابط | ملاحظات |
|---|---|---|
| محلي (Development) | `http://localhost:5173` (frontend) / `http://localhost:8080` (API) | `docker compose up --build` من `infrastructure/`؛ قاعدة بيانات افتراضية `file:./ghyari_local.db` |
| Staging | _لم يُحدَّد بعد_ | يُفترض نسخة من نفس إعداد Cloud Run بمشروع GCP منفصل — يُضاف هنا عند إنشائه |
| Production | `https://ghyari.sa` / `https://www.ghyari.sa` (حسب `ALLOWED_ORIGINS`) | يُنشر تلقائياً عند الدفع إلى `main` ضمن `ghyari-platform/**` |

### 3.2 لوحات تحكم السحابة والاستضافة

| الخدمة | الغرض | الرابط |
|---|---|---|
| Google Cloud Console | إدارة مشروع الاستضافة (`project-fc665c2c-22d9-477b-8de`, منطقة `me-central1`) | https://console.cloud.google.com/home/dashboard?project=project-fc665c2c-22d9-477b-8de |
| Cloud Run — API | الخدمة `ghyari-api` | https://console.cloud.google.com/run/detail/me-central1/ghyari-api |
| Cloud Run — Frontend | الخدمة `ghyari-frontend` | https://console.cloud.google.com/run/detail/me-central1/ghyari-frontend |
| Artifact Registry | صور Docker (`me-central1-docker.pkg.dev/project-fc665c2c-22d9-477b-8de/ghyari`) | https://console.cloud.google.com/artifacts?project=project-fc665c2c-22d9-477b-8de |
| Secret Manager | تخزين `ghyari-database-url`, `ghyari-database-auth-token`, `ghyari-anthropic-api-key` وغيرها | https://console.cloud.google.com/security/secret-manager?project=project-fc665c2c-22d9-477b-8de |
| Turso (libsql) | لوحة قاعدة البيانات الموزعة | https://turso.tech/app |
| Anthropic Console | إدارة مفاتيح Claude API المستخدمة في AI Radar | https://console.anthropic.com/settings/keys |

### 3.3 المستودعات وإدارة الإصدار

| المستودع | الغرض | الرابط |
|---|---|---|
| `aaaaaaaabajahabajH/libsql-client-go` | المستودع الرئيسي — يحوي كلاً من سائق libsql ومنصة غياري (`ghyari-platform/`) | https://github.com/aaaaaaaabajahabajH/libsql-client-go |
| Pull Requests | تتبع التغييرات والمراجعات | https://github.com/aaaaaaaabajahabajH/libsql-client-go/pulls |
| GitHub Actions | CI للسائق (`go.yml`) و CD لنشر غياري (`deploy-gcloud.yml`, `setup-gcloud.yml`) | https://github.com/aaaaaaaabajahabajH/libsql-client-go/actions |

### 3.4 خدمات الطرف الثالث

| الخدمة | الاستخدام | ملاحظة الإعداد |
|---|---|---|
| Anthropic Claude API | تحليل طلبات العملاء وتوليد إشارات الطلب (AI Radar) | مفتاح `ANTHROPIC_API_KEY`، النموذج مضبوط عبر `CLAUDE_MODEL` |
| Turso / libsql | قاعدة البيانات الرئيسية في الإنتاج | `DATABASE_URL` + `DATABASE_AUTH_TOKEN` |
| Google Cloud Storage | تخزين صور المنتجات والأصول | `GCS_BUCKET`, اختيارياً `GCS_CDN_BASE` لنطاق CDN مخصص |
| بوابات الدفع (مخطط لها) | Mada, STCPay, Tabby (BNPL) | غير مُفعّلة بعد في الكود — واردة في خارطة الطريق (المرحلة 3) |
| Redis | كاش + تنسيق عامل الرادار | يُدار تلقائياً داخل `docker-compose.yml` محلياً |

---

## 4. خريطة الميزات وخطة التنفيذ | Features & Roadmap

> المرجع الكامل بالتفصيل والمؤشرات الزمنية: [`docs/ROADMAP.md`](./ROADMAP.md). القيم أدناه ملخّصة وقد تكون الحالة الفعلية متقدمة أكثر مما هو موثّق — راجع نقاط نهاية `backend/main.go` كمصدر الحقيقة عن الميزات المُنفَّذة فعلياً.

### 4.1 الميزات المنفَّذة حالياً (بحسب نقاط النهاية القائمة في `backend/main.go`)

- مصادقة: تسجيل / دخول / تجديد توكن / تسجيل خروج (JWT)
- كتالوج المنتجات: قائمة، تفاصيل، بحث، توافق مع السيارات، قطع أداء، منتجات مميزة
- الماركات والموديلات: قائمة ماركات السيارات وموديلاتها
- الفئات: قائمة، تفاصيل، منتجات الفئة
- الموزعون: قائمة، تفاصيل، الأقرب جغرافياً، كتالوج كل موزع
- السلة والطلبات (محمية بمصادقة): إدارة السلة الكاملة، إنشاء/عرض/إلغاء الطلبات
- الرادار الذكي (طرف المستخدم): إرسال طلب عميل، توصيات مخصصة
- لوحة الإدارة: CRUD كامل للمنتجات + استيراد جماعي، إدارة الرادار الذكي (إشارات، اقتراحات، تحليل، الأكثر رواجاً)، إدارة الموزعين والتحقق منهم، إدارة الطلبات، رفع الملفات (رابط موقّع / رفع مباشر)

### 4.2 المحاور الاستراتيجية الخمسة

| المحور | الوصف |
|---|---|
| 1. قطع الاستهلاك السريع | تواير، بريكات، بطاريات، فلاتر، زيوت محرك من ماركات معروفة |
| 2. تزويد وأداء نيسان | Patrol Y62، GT-R R35، 350Z/370Z، Skyline — قطع HKS/Trust/Nismo/Tomei وإكسسوارات أداء |
| 3. شبكة الموزعين | موزعون معتمدون بالرياض/جدة/الدمام، نظام تحقق وتقييم، SLA توصيل 24-48 ساعة |
| 4. الرادار الذكي | رصد الطلبات في الوقت الفعلي، تحليل Claude، اقتراح مخزون تلقائي، معالجة عربية |
| 5. تجربة ثلاثية الأبعاد | Three.js للسيارات والقطع، هوية لونية مميزة، أنيماشن سلس، تجربة AR للتوافق (مخطط لها) |

### 4.3 المراحل القادمة (Milestones)

| المرحلة | المدة التقديرية | أبرز المخرجات |
|---|---|---|
| المرحلة 1 — الأساس | الشهر 1-2 | قاعدة البيانات، API الأساسية، واجهة أولية، تسجيل الدخول، كتالوج الاستهلاك السريع |
| المرحلة 2 — التوسع | الشهر 3-4 | قسم التزويد والأداء، بوابة الموزعين، الرادار الذكي، نظام توافق السيارات، واجهات 3D كاملة |
| المرحلة 3 — النضج | الشهر 5-6 | تطبيق جوال (React Native)، توصيات متقدمة، بوابات دفع محلية، لوحة تحكم للموزعين، برنامج ولاء |

### 4.4 مؤشرات الأداء الرئيسية (KPIs)

| المؤشر | هدف 6 أشهر | هدف 12 شهر |
|---|---|---|
| عدد المنتجات | 5,000 | 20,000 |
| الموزعون الشركاء | 20 | 100 |
| المستخدمون المسجلون | 10,000 | 100,000 |
| معدل التحويل | 3% | 5% |
| دقة الرادار الذكي | 80% | 95% |

---

## 5. دليل الإعداد والتشغيل | Setup & Deployment Guide

### 5.1 المتطلبات الأساسية

- Go 1.23+
- Node.js 18+ و npm
- Docker + Docker Compose (للتشغيل الكامل محلياً)
- حساب Turso (اختياري محلياً — الافتراضي SQLite محلي عبر `file:./ghyari_local.db`)
- مفتاح Anthropic API (لتفعيل الرادار الذكي فعلياً؛ بدونه يعمل الباقي في وضع التطوير)

### 5.2 التشغيل المحلي — خدمة بخدمة

```bash
# الواجهة الخلفية (تعمل على المنفذ 8080)
cd ghyari-platform/backend
go build ./...
go vet ./...
go run .          # تُشغَّل الترحيلات والبذر تلقائياً عند الإقلاع (internal/db)

# عامل الرادار الذكي
cd ghyari-platform/ai-engine
go build ./...

# الواجهة الأمامية
cd ghyari-platform/frontend
npm install
npm run dev        # خادم Vite للتطوير
npm run build       # tsc && vite build
npm run lint         # eslint src --ext ts,tsx
```

بدون `DATABASE_URL`، تتصل الواجهة الخلفية تلقائياً بملف SQLite محلي (`file:./ghyari_local.db`). التحقق من متغيرات البيئة الحرجة (`DATABASE_URL`, `JWT_SECRET`, `ANTHROPIC_API_KEY`) مفعّل فقط عند `GIN_MODE=release`، لذا التطوير المحلي يتسامح مع غيابها أو وجود قيم افتراضية.

### 5.3 التشغيل الكامل عبر Docker Compose

```bash
cd ghyari-platform/infrastructure
cp ../.env.example .env      # ثم املأ القيم الحقيقية (راجع التعليقات العربية داخل الملف)
docker compose up --build
```

يشغّل هذا: `api` (المنفذ 8080)، `frontend`، `redis`، `ai-radar`، و `nginx` (المنفذين 80/443) كوكيل عكسي أمام الخدمتين.

### 5.4 النشر إلى الإنتاج (Google Cloud Run)

النشر مُؤتمت بالكامل عبر GitHub Actions (`.github/workflows/deploy-gcloud.yml`):

- **المُحفّز:** أي دفع (push) إلى فرع `main` يمس مسارات `ghyari-platform/**`، أو تشغيل يدوي (`workflow_dispatch`).
- **الخطوات:** مصادقة إلى GCP → بناء صورتي Docker (`backend/Dockerfile`, `frontend/Dockerfile`) → دفعها إلى Artifact Registry (`me-central1-docker.pkg.dev/project-fc665c2c-22d9-477b-8de/ghyari`) → نشر إلى Cloud Run (`ghyari-api`, `ghyari-frontend` في `me-central1`) عبر `infrastructure/gcloud/cloudrun.yaml` → فحص صحة `/health`.
- **إعداد أوّلي لمرة واحدة:** `ghyari-platform/scripts/setup-gcloud.sh` — ينشئ Artifact Registry، حساب خدمة النشر، وأسرار Secret Manager (`ghyari-database-url`, `ghyari-database-auth-token`, `ghyari-anthropic-api-key`).
- هذا المسار منفصل تماماً عن CI الخاص بسائق libsql (`.github/workflows/go.yml`) ولا يعمل إلا عند تغيّر ملفات `ghyari-platform/`.

### 5.5 قائمة تحقق قبل أي نشر إنتاجي

1. تحديث `DATABASE_AUTH_TOKEN` إن كان قريباً من الانتهاء (Turso tokens).
2. التأكد أن `JWT_SECRET` في الإنتاج ليس القيمة الافتراضية `CHANGE_ME_...`.
3. مراجعة `ALLOWED_ORIGINS` تطابق النطاقات الفعلية المستخدمة.
4. التأكد من تحديث هذا الملف (القسم 3) إذا أُضيف مورد سحابي أو خدمة طرف ثالث جديدة.

---

## 6. سجل التحديثات (Changelog)

| التاريخ | التغيير |
|---|---|
| أغسطس 2026 | إنشاء أول نسخة من وثيقة التوثيق الشاملة، تجميعاً من `ARCHITECTURE.md`, `ROADMAP.md`, `.env.example`, وworkflows النشر |
