# Backup Strategy

This document covers database backup, restore procedures, and file storage backup for AI Business Assistant.

---

## Database Backups (Supabase PostgreSQL)

### Automatic Backups

Supabase provides automatic backups on paid plans:

| Plan | Backup Frequency | Retention |
|---|---|---|
| Free | None | — |
| Pro | Daily | 7 days |
| Team | Daily | 14 days |
| Enterprise | Custom | Custom |

**Action required:** Upgrade to Supabase Pro before launch for automatic daily backups.

Access backups: Supabase Dashboard → Settings → Database → Backups.

### Manual Backups

Take a manual backup before:
- Major deployments
- Running new migrations
- Any bulk data operation

**Using Supabase CLI:**
```bash
# Link to your production project
supabase link --project-ref your-project-ref

# Create a backup (downloads to local file)
supabase db dump --file backup-$(date +%Y%m%d-%H%M%S).sql
```

**Using pg_dump directly:**
```bash
# Get connection string from Supabase → Settings → Database → Connection string
pg_dump "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" \
  --no-privileges --no-owner \
  --file backup-$(date +%Y%m%d-%H%M%S).sql
```

### Point-in-Time Recovery (PITR)

Available on Supabase Team plan and above. PITR allows restoring to any second within the retention window.

Enable: Supabase Dashboard → Settings → Add-ons → Point-in-Time Recovery.

Recommended for: production databases handling real financial transactions.

### Offsite Backup Storage

Store manual backups in a separate location from the primary database:

```bash
# Example: upload to AWS S3
aws s3 cp backup-20260709.sql s3://your-backup-bucket/supabase/

# Example: upload to Google Cloud Storage
gsutil cp backup-20260709.sql gs://your-backup-bucket/supabase/
```

Retain offsite backups for **30 days** minimum.

---

## Restore Procedures

### From Supabase Dashboard (Automatic Backup)

1. Supabase Dashboard → Settings → Database → Backups
2. Select the backup point
3. Click **Restore** — this restores to the same project (destructive)

**Warning:** Restoring replaces all current data. Take a manual backup of the current state first.

### From a SQL Dump File

```bash
# Restore to a fresh Supabase project (recommended for testing restores)
psql "postgresql://postgres:[password]@db.[new-ref].supabase.co:5432/postgres" \
  --file backup-20260709.sql

# Or restore to the same project (destructive)
psql "postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres" \
  --file backup-20260709.sql
```

### Restore Testing Schedule

Verify that backups are restorable — a backup you cannot restore is not a backup.

**Recommended schedule:**
- Monthly: spin up a test Supabase project and restore the latest backup
- After major schema migrations: restore to a staging project and run smoke tests

---

## File Storage Backups (Supabase Storage)

User-uploaded files (avatars) are stored in Supabase Storage.

### Export Files

Supabase Storage does not have a built-in bulk export tool. Use the API:

```bash
# List all objects in the avatars bucket
curl https://your-project-ref.supabase.co/storage/v1/object/list/avatars \
  -H "Authorization: Bearer your-service-role-key" \
  | jq '.[] | .name'

# Download and archive (example with a simple shell loop)
mkdir -p backup-avatars
while IFS= read -r name; do
  curl -o "backup-avatars/$name" \
    "https://your-project-ref.supabase.co/storage/v1/object/avatars/$name" \
    -H "Authorization: Bearer your-service-role-key"
done < <(curl -s ... | jq -r '.[] | .name')

# Upload archive to S3 or GCS
tar -czf avatars-$(date +%Y%m%d).tar.gz backup-avatars/
aws s3 cp avatars-$(date +%Y%m%d).tar.gz s3://your-backup-bucket/storage/
```

### Storage Retention

Generated AI outputs are not stored as files — they are stored as text in the database (within the `generations` table). Database backups cover this data.

---

## Backup Schedule Summary

| Data | Method | Frequency | Retention | Location |
|---|---|---|---|---|
| PostgreSQL (Supabase) | Automatic (Pro plan) | Daily | 7 days | Supabase |
| PostgreSQL (Supabase) | Manual SQL dump | Pre-deploy | 30 days | S3 / GCS |
| User avatars (Storage) | API export script | Weekly | 30 days | S3 / GCS |
| Environment variables | Platform secrets | Continuous | N/A | Vercel / hosting |

---

## Disaster Recovery

### Recovery Time Objective (RTO)

Target: database restored within **2 hours** of a confirmed data loss event.

### Recovery Point Objective (RPO)

Target: maximum **24 hours** of data loss (daily backup cycle).

For PITR: maximum **1 hour** of data loss.

### Runbook

1. **Detect incident** — monitoring alert fires, or user reports
2. **Assess scope** — what data is affected? What time range?
3. **Take snapshot** — manual SQL dump of current (possibly corrupted) state
4. **Identify recovery point** — select backup that predates the incident
5. **Notify stakeholders** — inform team; consider posting a status page update
6. **Execute restore** — follow restore procedure above
7. **Verify integrity** — check row counts, spot-check user records, confirm Stripe subscriptions
8. **Resume traffic** — remove maintenance mode
9. **Post-mortem** — document root cause and preventive measures within 48 hours
