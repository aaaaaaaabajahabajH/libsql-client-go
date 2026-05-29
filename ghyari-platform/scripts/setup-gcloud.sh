#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════════
# غياري — إعداد Google Cloud لأول مرة
# تشغيل مرة واحدة فقط قبل أول نشر
# الاستخدام: bash setup-gcloud.sh
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

PROJECT="project-fc665c2c-22d9-477b-8de"
REGION="me-central1"
SA_NAME="ghyari-api"
DEPLOY_SA="ghyari-deploy"
BUCKET="ghyari-assets-${PROJECT}"
AR_REPO="ghyari"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo -e "\n${BLUE}══════════════════════════════════════════"
echo -e "   ☁️  إعداد Google Cloud — غياري منصة"
echo -e "══════════════════════════════════════════${NC}\n"

# ── Prerequisites ────────────────────────────────────────────────────────────
command -v gcloud &>/dev/null || { echo "gcloud CLI غير مثبّت. راجع https://cloud.google.com/sdk/install"; exit 1; }

info "تسجيل الدخول وتعيين المشروع..."
gcloud config set project "$PROJECT"
gcloud auth application-default login --quiet 2>/dev/null || true

# ── Enable APIs ──────────────────────────────────────────────────────────────
info "تفعيل Google Cloud APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  --project="$PROJECT"
ok "APIs مفعّلة"

# ── Artifact Registry repo ────────────────────────────────────────────────────
info "إنشاء Artifact Registry repository..."
gcloud artifacts repositories create "$AR_REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --project="$PROJECT" \
  --description="غياري Docker images" 2>/dev/null || warn "Repository موجود مسبقاً"
ok "Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT}/${AR_REPO}"

# ── GCS Bucket ────────────────────────────────────────────────────────────────
info "إنشاء GCS bucket للأصول..."
gcloud storage buckets create "gs://${BUCKET}" \
  --project="$PROJECT" \
  --location="$REGION" \
  --uniform-bucket-level-access 2>/dev/null || warn "Bucket موجود مسبقاً"

# تفعيل القراءة العامة على الـ bucket
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="allUsers" \
  --role="roles/storage.objectViewer" 2>/dev/null || true

# CORS للـ signed URLs (يسمح للمتصفح برفع الملفات مباشرة)
gcloud storage buckets update "gs://${BUCKET}" \
  --cors-file=- <<'CORS'
[{"origin":["https://ghyari.sa","https://www.ghyari.sa","http://localhost:3000"],"method":["GET","PUT","POST","HEAD"],"responseHeader":["Content-Type","Content-MD5","Content-Disposition"],"maxAgeSeconds":3600}]
CORS
ok "GCS Bucket: gs://${BUCKET}"

# ── Service Account (runtime) ─────────────────────────────────────────────────
info "إنشاء Service Account للـ API..."
gcloud iam service-accounts create "$SA_NAME" \
  --project="$PROJECT" \
  --display-name="Ghyari API Runtime" 2>/dev/null || warn "Service account موجود"

SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"

# أذونات للـ runtime service account
for role in \
  roles/storage.objectAdmin \
  roles/secretmanager.secretAccessor \
  roles/cloudtrace.agent; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$role" --quiet 2>/dev/null || true
done
ok "Runtime Service Account: ${SA_EMAIL}"

# ── Service Account (CI/CD deploy) ────────────────────────────────────────────
info "إنشاء Service Account للنشر (CI/CD)..."
gcloud iam service-accounts create "$DEPLOY_SA" \
  --project="$PROJECT" \
  --display-name="Ghyari Deploy (GitHub Actions)" 2>/dev/null || warn "Deploy service account موجود"

DEPLOY_SA_EMAIL="${DEPLOY_SA}@${PROJECT}.iam.gserviceaccount.com"

for role in \
  roles/run.admin \
  roles/artifactregistry.writer \
  roles/iam.serviceAccountUser; do
  gcloud projects add-iam-policy-binding "$PROJECT" \
    --member="serviceAccount:${DEPLOY_SA_EMAIL}" \
    --role="$role" --quiet 2>/dev/null || true
done
ok "Deploy Service Account: ${DEPLOY_SA_EMAIL}"

# ── Workload Identity Federation (GitHub Actions) ─────────────────────────────
info "إعداد Workload Identity Federation لـ GitHub Actions..."
POOL_NAME="ghyari-github-pool"
PROVIDER_NAME="ghyari-github-provider"
GITHUB_REPO="${GITHUB_REPO:-aaaaaaaabajahabajH/libsql-client-go}"

gcloud iam workload-identity-pools create "$POOL_NAME" \
  --project="$PROJECT" \
  --location=global \
  --display-name="GitHub Actions Pool" 2>/dev/null || warn "Pool موجود"

POOL_ID=$(gcloud iam workload-identity-pools describe "$POOL_NAME" \
  --project="$PROJECT" --location=global --format='value(name)')

gcloud iam workload-identity-pools providers create-oidc "$PROVIDER_NAME" \
  --project="$PROJECT" \
  --location=global \
  --workload-identity-pool="$POOL_NAME" \
  --display-name="GitHub OIDC" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
  --issuer-uri="https://token.actions.githubusercontent.com" 2>/dev/null || warn "Provider موجود"

# ربط الـ GitHub repo بالـ Service Account
gcloud iam service-accounts add-iam-policy-binding "$DEPLOY_SA_EMAIL" \
  --project="$PROJECT" \
  --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/${POOL_ID}/attribute.repository/${GITHUB_REPO}" \
  --quiet 2>/dev/null || true

PROVIDER_FULL_ID=$(gcloud iam workload-identity-pools providers describe "$PROVIDER_NAME" \
  --project="$PROJECT" --location=global --workload-identity-pool="$POOL_NAME" \
  --format='value(name)')

ok "Workload Identity Federation جاهز"

# ── Secret Manager ────────────────────────────────────────────────────────────
info "إنشاء الأسرار في Secret Manager..."

create_secret() {
  local name="$1"; local desc="$2"
  gcloud secrets create "$name" \
    --project="$PROJECT" \
    --replication-policy=user-managed \
    --locations="$REGION" \
    --labels=app=ghyari 2>/dev/null || warn "Secret '${name}' موجود"
  echo "  📋 أضف القيمة: gcloud secrets versions add ${name} --data-file=-"
}

create_secret "ghyari-database-url"       "Turso DATABASE_URL"
create_secret "ghyari-database-auth-token" "Turso DATABASE_AUTH_TOKEN"
create_secret "ghyari-jwt-secret"         "JWT signing secret"
create_secret "ghyari-anthropic-api-key"  "Anthropic Claude API key"
create_secret "ghyari-redis-url"          "Redis connection URL"
ok "الأسرار جاهزة في Secret Manager"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ إعداد Google Cloud اكتمل!${NC}"
echo -e "${GREEN}══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  الخطوات التالية:"
echo ""
echo "  1️⃣  أضف قيم الأسرار:"
echo "      echo 'libsql://...' | gcloud secrets versions add ghyari-database-url --data-file=-"
echo "      echo 'TOKEN'        | gcloud secrets versions add ghyari-database-auth-token --data-file=-"
echo "      openssl rand -hex 32 | gcloud secrets versions add ghyari-jwt-secret --data-file=-"
echo "      echo 'sk-ant-...'   | gcloud secrets versions add ghyari-anthropic-api-key --data-file=-"
echo "      echo 'redis://...'  | gcloud secrets versions add ghyari-redis-url --data-file=-"
echo ""
echo "  2️⃣  أضف هذا السر إلى GitHub Actions:"
echo "      الاسم:  GCP_WORKLOAD_IDENTITY_PROVIDER"
echo "      القيمة: ${PROVIDER_FULL_ID}"
echo ""
echo "  3️⃣  ادفع للـ main لتُطلق أول نشر تلقائي"
echo ""
