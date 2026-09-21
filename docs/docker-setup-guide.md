# Hướng dẫn setup Docker cho ForgeFlow

Tài liệu này hướng dẫn chạy ForgeFlow trên máy Windows, macOS hoặc Linux bằng Docker Compose.

## 1. Yêu cầu

Cài đặt:

- Docker Desktop trên Windows/macOS hoặc Docker Engine + Compose plugin trên Linux.
- Git nếu cần clone repository.
- Cổng `3000`, `5432`, `6379`, `8080` và `50000` chưa bị ứng dụng khác sử dụng.

Kiểm tra Docker:

```powershell
docker --version
docker compose version
docker info
```

Trên Windows, hãy mở Docker Desktop trước khi chạy các lệnh bên dưới.

## 2. Lấy mã nguồn

Nếu repository chưa có trên máy:

```powershell
git clone <URL_REPOSITORY> ForgeFlow
Set-Location ForgeFlow
```

Nếu đã mở workspace, chỉ cần chuyển đến thư mục gốc chứa `docker-compose.yml`:

```powershell
Set-Location D:\ForgeFlow
```

## 3. Kiểm tra cấu hình Compose

Chạy lệnh này trước lần khởi động đầu tiên để phát hiện lỗi YAML hoặc biến môi trường:

```powershell
docker compose config
```

Nếu lệnh hoàn tất và in ra cấu hình đã hợp nhất, có thể khởi động stack.

## 4. Build và khởi động

Build image backend rồi chạy ở chế độ nền:

```powershell
docker compose up -d --build
```

Xem trạng thái:

```powershell
docker compose ps
```

Kết quả mong đợi là bốn service `jenkins`, `backend`, `postgres` và `cache` đang chạy. Lần build đầu tiên sẽ cài các plugin Jenkins và có thể mất vài phút.

Jenkins có sẵn tại <http://localhost:8080>. Lấy mật khẩu đăng nhập lần đầu bằng:

```powershell
docker compose exec jenkins sh -c 'cat /var/jenkins_home/secrets/initialAdminPassword'
```

Image Jenkins đã cài các plugin Pipeline, Git, Credentials Binding, Docker Pipeline, Docker Commons, Blue Ocean, JUnit, Cobertura, JaCoCo, Slack, Email Extension, SonarQube Scanner, Kubernetes và SSH Agent. Docker socket được mount để các bước Docker trong pipeline có thể gọi Docker daemon của máy chủ.

Xem log trực tiếp:

```powershell
docker compose logs -f backend
```

Nhấn `Ctrl+C` để dừng việc theo dõi log; container vẫn tiếp tục chạy.

## 5. Kiểm tra hệ thống

Kiểm tra API health:

```powershell
curl http://localhost:3000/health
```

Kết quả thành công:

```json
{"status":"ok","database":"connected"}
```

Kiểm tra PostgreSQL:

```powershell
docker compose exec postgres pg_isready -U forgeflow -d forgeflow
```

Kiểm tra Redis:

```powershell
docker compose exec cache redis-cli ping
```

Kết quả mong đợi:

```text
PONG
```

## 6. Tạo bảng `tasks` để dùng API

Healthcheck chỉ kiểm tra kết nối PostgreSQL. Để các endpoint `/tasks` hoạt động, tạo bảng bằng lệnh sau:

```powershell
docker compose exec postgres psql -U forgeflow -d forgeflow -c "CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, title TEXT NOT NULL);"
```

Thử tạo và đọc task:

```powershell
curl -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d "{\"title\":\"Thiết lập ForgeFlow\"}"
curl http://localhost:3000/tasks
```

## 7. Dừng và khởi động lại

Dừng container nhưng giữ dữ liệu:

```powershell
docker compose stop
```

Khởi động lại các container đã dừng:

```powershell
docker compose start
```

Dừng và xóa container/network nhưng giữ named volumes:

```powershell
docker compose down
```

Dừng, xóa cả volume và toàn bộ dữ liệu PostgreSQL:

```powershell
docker compose down -v
```

Chỉ dùng `-v` khi thực sự muốn tạo lại database từ đầu.

## 8. Xử lý lỗi thường gặp

### Cổng đã được sử dụng

Tìm container đang dùng cổng:

```powershell
docker ps --format "table {{.Names}}\t{{.Ports}}"
```

Có thể dừng container đó hoặc đổi cổng bên trái trong `docker-compose.yml`, ví dụ `3001:3000`. Cổng bên phải phải giữ nguyên để backend vẫn lắng nghe trên `3000`.

### Backend thiếu module `express` hoặc `pg`

Bind mount `./app/backend:/app` có thể che thư mục `node_modules` trong image. Cài dependency tại máy host:

```powershell
Set-Location app/backend
npm install
Set-Location ../..
docker compose restart backend
```

Hoặc bỏ bind mount khi chỉ cần chạy image đã build, tùy mục đích sử dụng.

### Backend không healthy

Xem log:

```powershell
docker compose logs backend
```

Kiểm tra PostgreSQL:

```powershell
docker compose logs postgres
docker compose ps
```

Backend cần kết nối được đến service `postgres`; không thay `DB_HOST` bằng `localhost` khi backend chạy trong container.

### Dữ liệu bị mất

Kiểm tra volume:

```powershell
docker volume ls
docker volume inspect forgeflow_forgeflow-db-data
```

Tên volume có thể có prefix theo tên thư mục Compose. Không dùng `docker compose down -v` nếu muốn giữ dữ liệu.

## 9. Cập nhật code

Khi sửa code backend trong development, build lại image để bảo đảm Dockerfile vẫn đúng:

```powershell
docker compose up -d --build backend
```

Xem trạng thái image và container:

```powershell
docker image ls forgeflow-backend
docker compose ps
```

## 10. Dọn dẹp tài nguyên không dùng

Liệt kê image, container và volume trước khi xóa:

```powershell
docker image ls
docker ps -a
docker volume ls
```

Xóa image backend cụ thể:

```powershell
docker image rm forgeflow-backend:0.3
```

Không chạy các lệnh dọn dẹp toàn hệ thống nếu chưa kiểm tra vì chúng có thể ảnh hưởng đến project khác.
