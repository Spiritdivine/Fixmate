#!/usr/bin/env bash
# ==============================================================================
# Artifix Platform — Enterprise Automated PostgreSQL Backup Script
# Creates a compressed, point-in-time custom format dump (.dump) with optional
# AES-256 encryption and automated retention pruning.
#
# Usage:
#   ./scripts/backup-database.sh
#   BACKUP_DIR=/custom/dir ./scripts/backup-database.sh
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load .env if present
if [ -f "${ROOT_DIR}/.env" ]; then
  # Export variables from .env ignoring comments
  export $(grep -v '^#' "${ROOT_DIR}/.env" | xargs)
fi

BACKUP_DIR="${BACKUP_DIR:-${ROOT_DIR}/backups}"
mkdir -p "${BACKUP_DIR}"

TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_FILENAME="artisan_db_${TIMESTAMP}.dump"
BACKUP_FILEPATH="${BACKUP_DIR}/${BACKUP_FILENAME}"

echo "============================================================"
echo "📦 Artifix Platform — Database Backup Process"
echo "Timestamp: ${TIMESTAMP}"
echo "Destination: ${BACKUP_FILEPATH}"
echo "============================================================"

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not defined." >&2
  exit 1
fi

# Execute pg_dump using the connection string
echo "⏳ Exporting PostgreSQL schema and data via pg_dump..."
if command -v pg_dump >/dev/null 2>&1; then
  pg_dump "${DATABASE_URL}" \
    --format=custom \
    --no-owner \
    --no-privileges \
    --file="${BACKUP_FILEPATH}"
else
  echo "⚠️ pg_dump binary not found locally. Attempting docker pg_dump execution..."
  docker run --rm \
    -v "${BACKUP_DIR}:/backups" \
    postgres:16-alpine \
    pg_dump "${DATABASE_URL}" \
      --format=custom \
      --no-owner \
      --no-privileges \
      --file="/backups/${BACKUP_FILENAME}"
fi

BACKUP_SIZE=$(ls -lh "${BACKUP_FILEPATH}" | awk '{print $5}')
echo "✅ Database dump generated successfully: ${BACKUP_FILENAME} (${BACKUP_SIZE})"

# Optional AES-256 encryption
if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "🔒 Encrypting backup archive with AES-256-CBC..."
  openssl enc -aes-256-cbc -salt -pbkdf2 \
    -in "${BACKUP_FILEPATH}" \
    -out "${BACKUP_FILEPATH}.enc" \
    -pass pass:"${BACKUP_ENCRYPTION_KEY}"
  rm -f "${BACKUP_FILEPATH}"
  echo "🔐 Encrypted archive created: ${BACKUP_FILENAME}.enc"
fi

# Retention policy: Prune local backups older than 30 days
echo "🧹 Pruning backups older than 30 days..."
find "${BACKUP_DIR}" -type f \( -name "*.dump" -o -name "*.dump.enc" \) -mtime +30 -exec rm -f {} +

echo "🎉 Backup process completed successfully!"
