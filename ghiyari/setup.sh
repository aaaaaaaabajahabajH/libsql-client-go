#!/bin/bash
# ════════════════════════════════════════════
# غياري — سكريبت الإعداد السريع
# ════════════════════════════════════════════

set -e  # توقف عند أي خطأ

echo ""
echo "🚗 ════════════════════════════════════"
echo "   غياري — Ghiyari Auto Parts v2.0"
echo "   إعداد وتشغيل المشروع"
echo "════════════════════════════════════ 🚗"
echo ""

# ── 1. التحقق من Node.js ──
NODE_VERSION=$(node --version 2>/dev/null || echo "none")
if [ "$NODE_VERSION" = "none" ]; then
  echo "❌ Node.js غير مثبت."
  echo "   حمّله من: https://nodejs.org"
  exit 1
fi
echo "✅ Node.js: $NODE_VERSION"

# ── 2. التحقق من npm ──
NPM_VERSION=$(npm --version)
echo "✅ npm: $NPM_VERSION"
echo ""

# ── 3. نسخ ملف البيئة ──
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "📋 تم إنشاء .env من .env.example"
  echo "⚠️  أضف مفاتيح API في ملف .env قبل الاستخدام الكامل"
else
  echo "✅ ملف .env موجود"
fi
echo ""

# ── 4. تثبيت التبعيات ──
echo "📦 جاري تثبيت التبعيات..."
npm install --silent
echo "✅ تم تثبيت التبعيات"
echo ""

# ── 5. تشغيل خادم التطوير ──
echo "🚀 جاري تشغيل خادم التطوير..."
echo "   الرابط: http://localhost:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Ctrl+C لإيقاف الخادم"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
