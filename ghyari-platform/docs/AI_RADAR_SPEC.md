# مواصفات نظام الرادار الذكي | AI Radar System Specification

## نظرة عامة

الرادار الذكي هو "العقل" لمنصة غياري. يعمل بصمت في الخلفية ليرصد الطلبات التي لم تجد إجابة، ويحول كل حاجة غير مجابة إلى فرصة تجارية.

---

## كيف يعمل الرادار

```
Customer Search
     │
     ▼
[Search API]──── Found products? ──YES──► Return results
     │
     NO
     │
     ▼
[Log CustomerRequest]
     │
     ▼
[Redis Queue] ◄──── Batched every 5 min
     │
     ▼
[Claude AI Analysis]
     │
     ▼
[DemandSignal Generated]
     │
     ▼
[Admin Dashboard Alert]
     │
     ▼
[Distributor Notification]
     │
     ▼
Product Added to Catalog
```

---

## المراحل التقنية

### 1. التقاط الطلبات (Signal Capture)

كل بحث بدون نتائج يُسجَّل تلقائياً:

```json
{
  "query": "فلتر هواء فتك للباترول V8",
  "car_model": "Nissan Patrol Y62",
  "result_count": 0,
  "session_id": "abc123",
  "created_at": "2026-05-25T10:30:00Z"
}
```

**القاعدة:** نحتاج ≥3 طلبات مشابهة لتوليد إشارة طلب.

---

### 2. التحليل بالذكاء الاصطناعي (Claude Analysis)

**النموذج المستخدم:** `claude-opus-4-7`

**البرومبت الأساسي:**
```
أنت محلل متخصص في سوق قطع غيار السيارات الخليجي.
لديك قائمة من الطلبات التي لم تجد إجابة في المخزون.
حلّل الأنماط وأخرج:
1. القطع الأكثر طلباً
2. الفئة (استهلاك / أداء / تزويد)
3. أولوية التوريد
4. الاقتراح للموزع المناسب
```

---

### 3. معالجة الطلبات العربية

يدعم الرادار البحث باللهجات المختلفة:

| اللهجة | المثال | يُفهم على أنه |
|--------|--------|--------------|
| الفصحى | فلتر هواء للسيارة | Air Filter |
| السعودية | فلتر الهوا للسيارة | Air Filter |
| الإماراتية | فلتر باترول | Patrol Air Filter |
| الكلمات الشائعة | فتك = تزويد أداء | Performance Tuning |
| المزج | K&N filter للباترول | K&N Air Filter Patrol |

---

### 4. مستويات الأولوية (Urgency Levels)

| المستوى | الطلبات/أسبوع | الإجراء |
|---------|--------------|---------|
| 🟢 منخفض | 3-10 | إشعار أسبوعي |
| 🟡 متوسط | 11-30 | إشعار فوري للمدير |
| 🔴 عالي | 31-100 | إشعار + بحث موزع |
| 🚨 حرج | +100 | إجراء طارئ فوري |

---

### 5. تكامل Claude API

```go
// مثال على استدعاء Claude
func analyzeWithClaude(requests []CustomerRequest) []DemandSignal {
    prompt := buildArabicAnalysisPrompt(requests)
    
    response := claude.Messages.Create({
        model: "claude-opus-4-7",
        max_tokens: 4096,
        messages: [{
            role: "user",
            content: prompt,
        }],
    })
    
    return parseSignalsFromResponse(response)
}
```

---

### 6. التركيز على نيسان (Nissan Vertical)

الرادار لديه "عدسة خاصة" لتزويد نيسان نظراً لحجم الطلب في السوق السعودي:

**الموديلات ذات الأولوية:**
- باترول Y62 (VK56 V8) - أعلى طلب
- GTR R35 (VR38DETT) - أغلى قطع
- 350Z/370Z - قطع أداء أوروبية/يابانية
- Skyline R34 - قطع نادرة وتاريخية
- Altima 3.5L - سوق الحجم الكبير

**القطع الأكثر طلباً للتزويد:**
```
1. فلاتر هواء عالية الأداء (K&N, HKS)
2. مبردات بنزين (Fuel Intercoolers)
3. مضخات وقود عالية الضغط
4. نوازل إنجكتور (Injectors)
5. وحدات ECU (Nistune, JWT, AEM)
6. عوادم (Tomei, HKS, Greddy)
7. كيتات تيربو كاملة
8. مقاييس Defi/AEM
9. تعليق Tein/KW Suspension
10. بريكات Brembo/StopTech
```

---

## واجهة برمجة التطبيقات (API)

### تسجيل طلب عميل
```http
POST /api/v1/radar/request
{
  "query": "فلتر هواء K&N للباترول",
  "car_model": "Nissan Patrol Y62",
  "session_id": "abc123"
}
```

### استرجاع إشارات الطلب (للمدير)
```http
GET /api/v1/admin/ai/signals?urgency=high&limit=20
Authorization: Bearer <admin-token>
```

### تشغيل التحليل يدوياً
```http
POST /api/v1/admin/ai/analyze
Authorization: Bearer <admin-token>
```

---

## مؤشرات الأداء

| المؤشر | الهدف |
|--------|-------|
| دقة تصنيف الطلبات | >90% |
| وقت استجابة API | <200ms |
| دورة الطلب→المنتج | <72 ساعة |
| معدل تحويل الإشارات | >60% |
| دعم اللغة العربية | >95% |

---

*المواصفة النهائية - غياري 2026*
