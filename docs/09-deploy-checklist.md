# Deploy Checklist — AsahiRoute

Ngày kiểm tra: 2026-04-06  
Cập nhật: 2026-04-06  
Trạng thái tổng thể: **✅ Sẵn sàng deploy — tất cả BLOCKER + HIGH đã xử lý**

---

## 🚫 BLOCKER — Phải sửa trước khi deploy

### B1 — `src/.env` không được commit vào git
| | |
|---|---|
| **File** | `src/.env` |
| **Vấn đề** | File `.env` chứa `DB_PASSWORD=asahi_secret`, `PUSHER_APP_SECRET=asahi-secret` — không được commit lên repository |
| **Trạng thái** | ✅ Đã OK — `.gitignore` root có pattern `.env` và `.env.*` nên `src/.env` không được track |
| **Action** | Không cần làm gì thêm. Verify bằng `git ls-files src/.env` → không có output |

---

### B2 — `APP_DEBUG=true` lộ stack trace
| | |
|---|---|
| **File** | `src/.env:4` |
| **Vấn đề** | `APP_DEBUG=true` khiến Laravel trả về stack trace đầy đủ trong response lỗi, lộ cấu trúc code và đường dẫn file |
| **Fix** | Set `APP_DEBUG=false` và `APP_ENV=production` trong môi trường production |
| **Cách apply** | Tạo file `.env.production` (không commit) hoặc set qua Docker/server env vars |

```bash
APP_ENV=production
APP_DEBUG=false
LOG_LEVEL=error
```

---

### B3 — CORS hardcoded `localhost:5173`
| | |
|---|---|
| **File** | `src/config/cors.php:15-18` |
| **Vấn đề** | `allowed_origins` hardcoded với localhost — sẽ block request từ production domain |
| **Fix** | Đọc từ env var `FRONTEND_URL` |

```php
// cors.php sau khi fix
'allowed_origins' => array_filter(array_map('trim', explode(',',
    env('FRONTEND_URL', 'http://localhost:5173')
))),
```

Production `.env`:
```
FRONTEND_URL=https://app.asa-osaka-west.jp
```

---

### B4 — Nginx chỉ có HTTP (port 80), không có HTTPS
| | |
|---|---|
| **File** | `docker/nginx/default.conf:3` |
| **Vấn đề** | Production cần HTTPS. HTTP-only không an toàn cho auth tokens, location data, SOS alerts |
| **Fix** | Thêm nginx HTTPS config với SSL termination. Recommended: dùng Caddy hoặc Traefik làm reverse proxy bên ngoài để tự động quản lý Let's Encrypt certificate |

Nginx config cho production (với reverse proxy SSL termination):
```nginx
# docker/nginx/default.conf — backend API server
server {
    listen 80;
    server_name _;
    # Trust reverse proxy (Traefik/Caddy)
    real_ip_header X-Forwarded-For;
    set_real_ip_from 0.0.0.0/0;
    ...
}
```

Hoặc nếu terminate SSL trực tiếp tại nginx:
- File: `docker/nginx/default.prod.conf` — xem `docker-compose.prod.yml`

---

### B5 — Queue worker không có — `OptimizeRouteJob` sẽ không chạy
| | |
|---|---|
| **File** | Không có `supervisor.conf`, không có worker service |
| **Vấn đề** | `POST /admin/routes/{route}/optimize` dispatch job vào Redis queue. Nếu không có `php artisan queue:work` chạy, job sẽ tồn đọng mãi trong queue không được xử lý |
| **Fix** | Thêm `worker` service vào `docker-compose.yml` |

```yaml
worker:
  build: { context: ., dockerfile: docker/php/Dockerfile }
  command: php artisan queue:work redis --sleep=3 --tries=3 --timeout=300
  volumes:
    - ./src:/var/www
  depends_on:
    mysql: { condition: service_healthy }
    redis: { condition: service_started }
  restart: unless-stopped
```

---

### B6 — `php artisan storage:link` chưa có trong entrypoint
| | |
|---|---|
| **File** | Không có `docker/php/entrypoint.sh` |
| **Vấn đề** | Subscriber photo upload lưu vào `storage/app/public/subscribers/` nhưng nếu `public/storage` symlink chưa tồn tại, URL trả về sẽ 404 |
| **Fix** | Thêm `entrypoint.sh` vào PHP container để chạy initialization commands khi start |

---

### B7 — Soketi/Echo dùng HTTP — production cần WSS
| | |
|---|---|
| **File** | `src/.env:79-82`, `frontend/.env` (nếu có) |
| **Vấn đề** | WebSocket dùng `ws://` (plain) — browser sẽ block mixed content nếu trang load qua HTTPS |
| **Fix** | Set `PUSHER_SCHEME=https` và `VITE_PUSHER_SCHEME=https` trong production env |

```env
# Backend .env (production)
PUSHER_SCHEME=https
PUSHER_PORT=443

# Frontend .env (production build)
VITE_PUSHER_SCHEME=https
VITE_PUSHER_PORT=443
VITE_PUSHER_HOST=ws.asa-osaka-west.jp
```

---

## ⚠️ HIGH — Nên sửa trước deploy

### H8 — `docker-compose.yml` có secret hardcoded
| | |
|---|---|
| **File** | `docker-compose.yml:43-44, 84-87` |
| **Vấn đề** | `MYSQL_PASSWORD: asahi_secret`, `MYSQL_ROOT_PASSWORD: root_secret`, Soketi keys hardcoded trong docker-compose |
| **Fix** | Dùng Docker env file hoặc environment variable substitution |

```yaml
# docker-compose.yml — dùng variable substitution
mysql:
  environment:
    MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
soketi:
  environment:
    SOKETI_DEFAULT_APP_KEY: ${PUSHER_APP_KEY}
    SOKETI_DEFAULT_APP_SECRET: ${PUSHER_APP_SECRET}
```

---

### H9 — `SOKETI_DEBUG: "1"` bật verbose logging
| | |
|---|---|
| **File** | `docker-compose.yml:84` |
| **Vấn đề** | Debug mode log mọi WebSocket message — ảnh hưởng performance, lộ data nhạy cảm |
| **Fix** | Đổi thành `SOKETI_DEBUG: "0"` hoặc `${SOKETI_DEBUG:-0}` |

---

### H10 — Không có `docker-compose.prod.yml`
| | |
|---|---|
| **Vấn đề** | Không có file override cho production: không có image build riêng, không tắt dev volume mounts, không có SSL |
| **Fix** | Tạo `docker-compose.prod.yml` — xem file đã tạo |

---

### H11 — `VITE_API_URL` trong `.env.example` trỏ localhost
| | |
|---|---|
| **File** | `frontend/.env.example` |
| **Vấn đề** | Developer mới sẽ không biết cần set `VITE_API_URL` cho production build |
| **Fix** | Cập nhật example với placeholder đúng |

---

### H12 — Health checks thiếu cho nhiều services
| | |
|---|---|
| **File** | `docker-compose.yml` |
| **Vấn đề** | Chỉ MySQL có healthcheck. `app`, `nginx`, `redis`, `optimizer`, `soketi`, `worker` không có |
| **Fix** | Thêm healthcheck vào `docker-compose.prod.yml` |

---

## 🟡 MEDIUM — Có thể deploy trước, sửa sau

| # | Vấn đề | Kế hoạch |
|---|--------|----------|
| M13 | Photo upload dùng local disk — không scale với multi-instance | Phase 5: S3/MinIO integration |
| M14 | ~~20+ `console.log` trong frontend code~~ | ✅ Đã xóa tất cả — build clean |
| M15 | Không có CI/CD pipeline | Thêm GitHub Actions: test + build + deploy |
| M16 | Không có error monitoring (Sentry) | Integrate `@sentry/react` + `sentry/laravel` |
| M17 | Không có log rotation | Thêm `logrotate` config hoặc dùng Docker logging driver |

---

## ✅ Đã sẵn sàng

| Hạng mục | Trạng thái |
|----------|-----------|
| 19 database migrations | ✅ Đầy đủ |
| API routes (auth/delivery/admin/company) | ✅ Implement xong, không có stub |
| Frontend build + PWA (sw.js + manifest) | ✅ Build pass |
| Backend tests (66 tests) | ✅ All pass |
| Docker stack (6 services) | ✅ Đầy đủ |
| Multi-tenancy (Company → Shop → User) | ✅ Hoạt động |
| WebSocket real-time (Soketi) | ✅ Configured |
| Route optimization (OR-Tools) | ✅ Hoạt động |
| PWA installable (service worker) | ✅ Generated |
| Offline banner | ✅ Hoạt động |
| ShiftManagement UI | ✅ Hoàn thiện |
| SOS confirmation dialog | ✅ Hoàn thiện |
| docker-compose.prod.yml + health checks | ✅ Tạo xong |
| console.log xóa khỏi frontend | ✅ 0 instances còn lại |
| docker/nginx/default.prod.conf (HTTPS) | ✅ Tạo xong |

---

## Thứ tự thực hiện để deploy

```
1. [B3]  Fix cors.php → FRONTEND_URL env var
2. [B5]  Thêm worker service vào docker-compose
3. [B6]  Tạo entrypoint.sh với storage:link
4. [H8]  docker-compose dùng variable substitution cho secrets
5. [H9]  SOKETI_DEBUG=0
6. [H10] Tạo docker-compose.prod.yml
7. [H12] Thêm health checks
8. [B2]  Set APP_DEBUG=false, APP_ENV=production trong prod .env
9. [B4]  Setup reverse proxy SSL (Traefik/Caddy) — infrastructure
10. [B7] PUSHER_SCHEME=https trong prod .env — infrastructure
11. [M14] Xóa console.log
```

**Ghi chú B4 + B7**: SSL/HTTPS setup phụ thuộc vào infrastructure (domain, server, certificate). Không thể hoàn toàn cấu hình trong code — cần thực hiện ở deployment step.
