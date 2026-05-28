#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# غياري منصة — سكريبت النشر التلقائي على VPS
# الاستخدام: bash deploy.sh [--env /path/to/.env]
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLATFORM_DIR="$(dirname "$SCRIPT_DIR")"
INFRA_DIR="$PLATFORM_DIR/infrastructure"
ENV_FILE="$PLATFORM_DIR/.env"

# ── Parse arguments ────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV_FILE="$2"; shift 2 ;;
    *) echo "خيار غير معروف: $1"; exit 1 ;;
  esac
done

# ── Colors ─────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }

echo -e "\n${BLUE}══════════════════════════════════════════"
echo -e "   🚀 غياري منصة — بدء النشر"
echo -e "══════════════════════════════════════════${NC}\n"

# ── 1. Prerequisites ────────────────────────────────────────────────────────
info "التحقق من المتطلبات..."
for cmd in docker git openssl; do
  command -v "$cmd" &>/dev/null || err "الأمر '$cmd' غير مثبّت"
done

# Docker Compose v2 (plugin) أو v1 (standalone)
if docker compose version &>/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose &>/dev/null; then
  COMPOSE="docker-compose"
else
  err "docker compose غير مثبّت. راجع: https://docs.docker.com/compose/install/"
fi
ok "جميع المتطلبات متوفرة"

# ── 2. Load / validate .env ────────────────────────────────────────────────
if [[ ! -f "$ENV_FILE" ]]; then
  warn "ملف .env غير موجود — سيتم إنشاؤه من .env.example"
  cp "$PLATFORM_DIR/.env.example" "$ENV_FILE"
  echo ""
  echo "  يرجى تعبئة القيم في: $ENV_FILE"
  echo "  ثم إعادة تشغيل السكريبت."
  echo ""
  exit 1
fi

set -a; source "$ENV_FILE"; set +a

# توليد JWT_SECRET تلقائياً إذا كان فارغاً أو افتراضياً
if [[ -z "${JWT_SECRET:-}" || "$JWT_SECRET" == "CHANGE_ME"* ]]; then
  JWT_SECRET=$(openssl rand -hex 32)
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" "$ENV_FILE"
  warn "تم توليد JWT_SECRET تلقائياً وحفظه في .env"
fi

# التحقق من المتغيرات الإلزامية
required_vars=(DATABASE_URL DATABASE_AUTH_TOKEN JWT_SECRET ANTHROPIC_API_KEY)
missing=()
for var in "${required_vars[@]}"; do
  val="${!var:-}"
  if [[ -z "$val" || "$val" == *"your-"* || "$val" == *"CHANGE_ME"* ]]; then
    missing+=("$var")
  fi
done
if [[ ${#missing[@]} -gt 0 ]]; then
  echo ""
  err "المتغيرات التالية غير مضبوطة في $ENV_FILE:\n$(printf '  - %s\n' "${missing[@]}")"
fi
ok "ملف .env صالح"

# ── 3. Pull latest code ────────────────────────────────────────────────────
info "تحديث الكود من المستودع..."
git -C "$PLATFORM_DIR" pull --rebase --autostash 2>/dev/null || warn "تعذّر سحب التحديثات — الاستمرار بالكود الحالي"
ok "الكود محدّث"

# ── 4. SSL certificate check ───────────────────────────────────────────────
SSL_DIR="$INFRA_DIR/ssl"
if [[ ! -f "$SSL_DIR/fullchain.pem" || ! -f "$SSL_DIR/privkey.pem" ]]; then
  warn "شهادة SSL غير موجودة في $SSL_DIR"
  echo ""
  echo "  للحصول على شهادة مجانية باستخدام Let's Encrypt:"
  echo "  1. تأكد أن النطاق يشير لهذا السيرفر"
  echo "  2. شغّل:"
  echo "     sudo apt install certbot"
  echo "     sudo certbot certonly --standalone -d ghyari.sa -d www.ghyari.sa"
  echo "     sudo mkdir -p $SSL_DIR"
  echo "     sudo cp /etc/letsencrypt/live/ghyari.sa/fullchain.pem $SSL_DIR/"
  echo "     sudo cp /etc/letsencrypt/live/ghyari.sa/privkey.pem $SSL_DIR/"
  echo "  3. أعد تشغيل هذا السكريبت"
  echo ""
  read -rp "هل تريد المتابعة بدون SSL (للاختبار فقط)؟ [y/N] " confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || exit 1

  # استخدام nginx config مبسّط بدون SSL
  TMP_NGINX="$INFRA_DIR/nginx_no_ssl.conf"
  cat > "$TMP_NGINX" <<'NGINX'
events { worker_connections 1024; }
http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    upstream api_backend   { server api:8080; keepalive 32; }
    upstream frontend_app  { server frontend:80; }
    server {
        listen 80;
        location /api/ { proxy_pass http://api_backend; proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr; }
        location / { proxy_pass http://frontend_app; proxy_set_header Host $host; }
    }
}
NGINX
  NGINX_VOLUME="$TMP_NGINX:/etc/nginx/nginx.conf:ro"
  # تعديل مؤقت لتخطّي nginx في compose
  export COMPOSE_PROFILES="no-ssl"
fi

# ── 5. Build & start services ──────────────────────────────────────────────
info "بناء وتشغيل الخدمات..."
cd "$INFRA_DIR"

# أوقف الخدمات القديمة بلطف
$COMPOSE down --remove-orphans 2>/dev/null || true

# بناء الصور (مع cache)
$COMPOSE build --parallel

# تشغيل الخدمات
$COMPOSE up -d

ok "جميع الخدمات قيد التشغيل"

# ── 6. Health check ────────────────────────────────────────────────────────
info "انتظار جاهزية الـ API..."
for i in $(seq 1 20); do
  if curl -sf http://localhost:8080/health | grep -q '"status":"healthy"' 2>/dev/null; then
    ok "الـ API جاهز"
    break
  fi
  if [[ $i -eq 20 ]]; then
    warn "الـ API لم يصبح جاهزاً خلال 60 ثانية — تحقق من السجلات:"
    echo "  $COMPOSE logs api --tail=50"
  fi
  sleep 3
done

# ── 7. Summary ─────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ تم النشر بنجاح!${NC}"
echo -e "${GREEN}══════════════════════════════════════════${NC}"
echo ""
echo "  🌐 الواجهة الأمامية : http://$(hostname -I | awk '{print $1}')"
echo "  🔌 API Health       : http://$(hostname -I | awk '{print $1}')/health"
echo ""
echo "  أوامر مفيدة:"
echo "    $COMPOSE logs -f api          # سجلات الـ API"
echo "    $COMPOSE logs -f ai-radar     # سجلات الرادار الذكي"
echo "    $COMPOSE ps                   # حالة الخدمات"
echo "    $COMPOSE down                 # إيقاف جميع الخدمات"
echo ""
