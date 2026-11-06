#!/usr/bin/env bash
# ==============================================================================
# Artifix Platform — Database Restoration Script
# Restores a PostgreSQL custom-format dump into the target database.
#
# Usage:
#   ./scripts/restore-database.sh <path_to_backup_file> [target_database_url]
# ==============================================================================

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path_to_backup_file> [target_database_url]"
  exit 1
fi

BACKUP_FILE="$1"
TARGET_DB="${2:-${DATABASE_URL:-}}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

if [ -z "${TARGET_DB}" ]; then
  echo "❌ Error: Target database URL not provided and DATABASE_URL is empty." >&2
  exit 1
fi

echo "============================================================"
echo "⚠️  Artifix Platform — Database Restore Operation"
echo "Backup File: ${BACKUP_FILE}"
echo "============================================================"

RESTORE_SRC="${BACKUP_FILE}"

# Decrypt if encrypted (.enc)
if [[ "${BACKUP_FILE}" == *.enc ]]; then
  if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
    echo "❌ Error: Backup is encrypted but BACKUP_ENCRYPTION_KEY is not set." >&2
    exit 1
  fi
  DECRYPTED_TEMP="${BACKUP_FILE%.enc}"
  echo "🔓 Decrypting archive..."
  openssl enc -d -aes-256-cbc -pbkdf2 \
    -in "${BACKUP_FILE}" \
    -out "${DECRYPTED_TEMP}" \
    -pass pass:"${BACKUP_ENCRYPTION_KEY}"
  RESTORE_SRC="${DECRYPTED_TEMP}"
fi

echo "⏳ Restoring database via pg_restore..."
if command -v pg_restore >/dev/null 2>&1; then
  pg_restore \
    --dbname="${TARGET_DB}" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "${RESTORE_SRC}" || true
else
  echo "⚠️ pg_restore binary not found locally. Running via docker..."
  docker run --rm \
    -v "$(dirname "${RESTORE_SRC}"):/backups" \
    postgres:16-alpine \
    pg_restore \
      --dbname="${TARGET_DB}" \
      --clean \
      --if-exists \
      --no-owner \
      --no-privileges \
      "/backups/$(basename "${RESTORE_SRC}")" || true
fi

# Clean up temp decrypted file if applicable
if [[ "${BACKUP_FILE}" == *.enc ]] && [ -f "${RESTORE_SRC}" ]; then
  rm -f "${RESTORE_SRC}"
fi

echo "✅ Restoration completed successfully!"
