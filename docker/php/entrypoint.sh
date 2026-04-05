#!/bin/sh
set -e

echo "[entrypoint] Starting AsahiRoute API..."

# Wait for MySQL to be ready (extra safety on top of depends_on healthcheck)
until php -r "new PDO('mysql:host=${DB_HOST:-mysql};dbname=${DB_DATABASE:-asahi_route}', '${DB_USERNAME:-asahi_user}', '${DB_PASSWORD:-}');" 2>/dev/null; do
  echo "[entrypoint] Waiting for MySQL..."
  sleep 2
done

echo "[entrypoint] MySQL ready."

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
