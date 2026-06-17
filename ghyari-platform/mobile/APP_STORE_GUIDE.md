# Ghyari — Apple App Store Submission Guide

## App Information

| Field | Value |
|-------|-------|
| App Name | غياري |
| Subtitle | قطع السيارات الأصلية |
| Bundle ID | com.ghyari.app |
| Category | Shopping |
| Secondary Category | Automotive |
| Language | Arabic (Primary), English |
| Age Rating | 4+ |
| Price | Free |

## App Description (Arabic — Primary)

**غياري — المنصة الأولى لقطع السيارات في العالم العربي**

أكبر تشكيلة قطع سيارات أصلية وتزويد في المملكة العربية السعودية والإمارات.

🔧 **أكثر من 20,000 قطعة**
- قطع أصلية OEM مضمونة
- قطع تزويد وأداء (Brembo, K&N, HKS, ARB, Bilstein)
- تواير وبطاريات وإكسسوارات

🚗 **فلتر سيارتك**
- حدد ماركة وموديل سيارتك
- شوف القطع المتوافقة فقط
- يدعم كل السيارات الشائعة

⚡ **رادار الذكاء الاصطناعي**
- مو لاقي قطعتك؟ اطلبها!
- ذكاؤنا الاصطناعي يضيفها خلال أسبوع

🚚 **توصيل سريع**
- 24-48 ساعة في الرياض وجدة والدمام ودبي
- شحن مجاني للطلبات فوق 500 ريال

## App Description (English)

**Ghyari — The #1 Auto Parts Platform in the Arab World**

The largest selection of genuine auto parts and performance upgrades in Saudi Arabia and UAE.

🔧 **20,000+ Parts**
- Genuine OEM parts guaranteed
- Performance & tuning parts (Brembo, K&N, HKS, ARB, Bilstein)
- Tires, batteries, and accessories

🚗 **Car Compatibility Filter**
- Select your car make and model
- See only compatible parts
- Supports all popular vehicles

⚡ **AI Radar**
- Can't find your part? Request it!
- Our AI adds it within a week

🚚 **Fast Delivery**
- 24-48 hours in Riyadh, Jeddah, Dammam & Dubai
- Free shipping on orders above 500 SAR

## Keywords
قطع غيار, سيارات, قطع سيارات, تزويد نيسان, فتك, Nissan, auto parts, car parts, Saudi Arabia, UAE

## Screenshots Required

### iPhone 6.9" (iPhone 15 Pro Max) — Required
1. Home screen showing featured products
2. Product catalog with car filter active
3. Product detail screen with 3D view
4. Cart screen
5. Order confirmation screen

### iPhone 6.5" (iPhone 14 Plus) — Required
Same 5 screenshots

### iPad Pro 12.9" — Required if supporting iPad

## App Preview Video (Optional but Recommended)
- 30 second video showing the main flow: Browse → Filter by car → Add to cart → Checkout

## Privacy Policy URL
https://ghyari.sa/privacy

## Terms of Service URL
https://ghyari.sa/terms

## Support URL
https://ghyari.sa/support

## Marketing URL (optional)
https://ghyari.sa

---

## Build & Submit Steps

### Prerequisites
1. Apple Developer Account ($99/year)
2. App Store Connect app set up
3. EAS account: `npx eas login`

### 1. Configure signing
```bash
cd ghyari-platform/mobile
npx eas credentials
```

### 2. Build for App Store
```bash
npx eas build --platform ios --profile production
```

### 3. Submit to App Store
```bash
npx eas submit --platform ios
```

Or manually upload the .ipa via Transporter app.

### 4. Fill in App Store Connect
- Go to https://appstoreconnect.apple.com
- Add app description, screenshots, keywords
- Set up In-App Purchases if needed (none for v1)
- Submit for review

### Expected Review Time
- First submission: 24-48 hours
- Updates: 24 hours
- Expedited review available for critical bugs

---

## Asset Specifications

### App Icon (Required)
- Size: 1024×1024 px
- Format: PNG (no alpha/transparency)
- No rounded corners (Apple applies them)
- No text (guidelines violation)

### Screenshots
- iPhone 6.9": 1320×2868 or 1290×2796 px
- iPhone 6.5": 1284×2778 or 1242×2688 px

Recommended tool: Figma or Sketch with Apple device frames

### App Preview Video
- .mp4 or .mov
- Max 30 seconds
- Portrait orientation for iPhone

---

## Review Guidelines Compliance

✅ Arabic RTL support (I18nManager.forceRTL)
✅ Privacy manifest (NSPrivacyAccessedAPITypes)
✅ No tracking without consent
✅ Secure token storage (expo-secure-store → iOS Keychain)
✅ HTTPS API calls only
✅ No misleading content
✅ Payment: Cash on Delivery (no in-app payments needed)
✅ Legal: Terms of Service, Privacy Policy linked
