#!/bin/sh
set -e

echo "[entrypoint] Starting AsahiRoute API..."

# Determine DB connection from .env
DB_CON=$(grep "^DB_CONNECTION=" /var/www/.env | cut -d '=' -f2 | tr -d '\r')
DB_CON="${DB_CON:-mysql}"
DB_HOST=$(grep "^DB_HOST=" /var/www/.env | cut -d '=' -f2 | tr -d '\r')
DB_PORT=$(grep "^DB_PORT=" /var/www/.env | cut -d '=' -f2 | tr -d '\r')
DB_USER=$(grep "^DB_USERNAME=" /var/www/.env | cut -d '=' -f2 | tr -d '\r')
DB_PASS=$(grep "^DB_PASSWORD=" /var/www/.env | cut -d '=' -f2 | tr -d '\r')

DB_DATABASE=$(grep "^DB_DATABASE=" /var/www/.env | cut -d '=' -f2 | tr -d '\r')
DB_DATABASE="${DB_DATABASE:-postgres}"

if [ "$DB_CON" = "mysql" ]; then
  echo "[entrypoint] Waiting for MySQL at ${DB_HOST:-mysql}..."
  until php -r "new PDO('mysql:host=${DB_HOST:-mysql};dbname=${DB_DATABASE:-asahi_route}', '${DB_USER:-asahi_user}', '${DB_PASS:-}');" 2>/dev/null; do
    echo "[entrypoint] Waiting for MySQL..."
    sleep 2
  done
  echo "[entrypoint] MySQL ready."
elif [ "$DB_CON" = "pgsql" ]; then
  echo "[entrypoint] Using PostgreSQL (${DB_HOST}). Checking connection..."
  until php -r "new PDO('pgsql:host=${DB_HOST};port=${DB_PORT:-5432};dbname=${DB_DATABASE}', '${DB_USER}', '${DB_PASS}');" 2>/dev/null; do
    echo "[entrypoint] Waiting for PostgreSQL..."
    sleep 3
  done
  echo "[entrypoint] PostgreSQL ready."
else
  echo "[entrypoint] DB_CONNECTION=${DB_CON}, skipping wait."
fi

# Generate app key if not set
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
  echo "[entrypoint] Generating APP_KEY..."
  php artisan key:generate --force
fi

# Run pending migrations
echo "[entrypoint] Running migrations..."
php artisan migrate --force

# Create storage symlink (public/storage → storage/app/public)
echo "[entrypoint] Creating storage symlink..."
php artisan storage:link --force 2>/dev/null || true

# Clear config/route/view cache and re-cache for production
if [ "$APP_ENV" = "production" ]; then
  echo "[entrypoint] Caching for production..."
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
else
  echo "[entrypoint] Clearing caches (non-production)..."
  php artisan config:clear
  php artisan route:clear
  php artisan view:clear
fi

echo "[entrypoint] Initialization complete. Starting PHP-FPM..."
exec php-fpm
