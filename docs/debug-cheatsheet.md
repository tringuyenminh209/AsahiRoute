# 🔧 AsahiRoute — Debug Cheatsheet (EC2 + Docker)

---

## 1. SSH vào EC2

```bash
ssh -i asahi-key.pem ec2-user@<ElasticIP>
```

> Thay `<ElasticIP>` bằng IP lấy từ CloudFormation Outputs → `ElasticIPAddress`

---

## 2. Kiểm tra UserData (script khởi động EC2)

```bash
# Xem toàn bộ log UserData chạy lúc EC2 mới boot
sudo cat /var/log/user-data.log

# Xem 100 dòng cuối (nếu log dài)
sudo tail -100 /var/log/user-data.log

# Xem realtime (nếu EC2 đang khởi động)
sudo tail -f /var/log/user-data.log
```

---

## 3. Kiểm tra Docker và các container

```bash
# Xem tất cả container đang chạy
cd /opt/asahi
docker compose ps

# Xem tất cả container kể cả đã dừng
docker compose ps -a

# Xem logs tất cả services (50 dòng cuối)
docker compose logs --tail=50

# Xem logs realtime tất cả services
docker compose logs -f

# Xem logs 1 service cụ thể
docker compose logs app          # Laravel app
docker compose logs nginx        # Web server
docker compose logs redis        # Redis
docker compose logs worker       # Queue worker
docker compose logs soketi       # WebSocket
docker compose logs optimizer    # Optimizer service

# Xem logs realtime 1 service
docker compose logs -f app
docker compose logs -f nginx
```

---

## 4. Kiểm tra .env đã đúng chưa

```bash
# Xem nội dung file .env (ẩn password)
cat /opt/asahi/.env | grep -v PASSWORD | grep -v SECRET | grep -v KEY

# Kiểm tra DB connection
cat /opt/asahi/.env | grep DB_

# Kiểm tra APP_URL
cat /opt/asahi/.env | grep APP_URL
```

---

## 5. Kiểm tra Laravel app

```bash
# Chạy lệnh trong container app
docker compose exec app php artisan --version

# Kiểm tra kết nối database Supabase
docker compose exec app php artisan db:show

# Xem migration status
docker compose exec app php artisan migrate:status

# Chạy migration (nếu chưa chạy)
docker compose exec app php artisan migrate --force

# Clear cache
docker compose exec app php artisan config:clear
docker compose exec app php artisan cache:clear
docker compose exec app php artisan route:clear
```

---

## 6. Kiểm tra Nginx

```bash
# Test Nginx config có lỗi không
docker compose exec nginx nginx -t

# Reload Nginx không restart
docker compose exec nginx nginx -s reload

# Test HTTP response
curl -I http://localhost
curl -I https://localhost --insecure

# Xem access log
docker compose exec nginx tail -50 /var/log/nginx/access.log

# Xem error log
docker compose exec nginx tail -50 /var/log/nginx/error.log
```

---

## 7. Restart services

```bash
cd /opt/asahi

# Restart 1 service
docker compose restart app
docker compose restart nginx
docker compose restart worker

# Restart tất cả
docker compose -f docker-compose.yml -f docker-compose.prod.yml restart

# Dừng và khởi động lại hoàn toàn
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

---

## 8. Deploy code mới

```bash
cd /opt/asahi

# Pull code mới từ GitHub
git pull origin main

# Rebuild và restart (giữ data)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Chạy migration
docker compose exec app php artisan migrate --force

# Cache lại
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
```

---

## 9. Kiểm tra tài nguyên hệ thống

```bash
# Xem RAM + CPU
htop
# (hoặc nếu chưa cài htop)
free -h
top

# Xem disk còn bao nhiêu
df -h

# Xem Docker đang dùng bao nhiêu disk
docker system df

# Xem swap
swapon --show
```

---

## 10. Kiểm tra SSL

```bash
# Chạy setup SSL (sau khi DNS đã propagate)
sudo asahi-ssl-setup.sh

# Kiểm tra cert còn hạn bao lâu
sudo certbot certificates

# Test HTTPS từ bên ngoài
curl -I https://api.todokizamu.me
curl -I https://ws.todokizamu.me

# Xem cert trong docker ssl dir
ls -la /opt/asahi/docker/nginx/ssl/
```

---

## 11. Các lỗi thường gặp

### ❌ Container bị Exit/Crash
```bash
# Xem container nào bị lỗi
docker compose ps -a

# Xem lý do crash
docker compose logs <tên-service> --tail=100
```

### ❌ Laravel báo lỗi 500
```bash
docker compose exec app cat storage/logs/laravel.log | tail -50
```

### ❌ Database không kết nối được
```bash
docker compose exec app php artisan db:show
# Nếu lỗi → kiểm tra DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD trong .env
cat /opt/asahi/.env | grep DB_
```

### ❌ Redis không kết nối
```bash
docker compose exec redis redis-cli ping
# Kết quả phải là: PONG
```

### ❌ Nginx báo 502 Bad Gateway
```bash
# App container chưa chạy → restart app
docker compose restart app
docker compose logs app --tail=50
```

### ❌ Không SSH được vào EC2
```bash
# Kiểm tra lại Security Group có mở port 22 không
# Trên AWS Console → EC2 → Security Groups → Inbound rules
# Hoặc dùng AWS SSM Session Manager (không cần SSH key):
aws ssm start-session --target <instance-id> --region ap-northeast-3
```
