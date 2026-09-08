# WEEK 1: DOCKER FUNDAMENTALS - CHI TIẾT HƯỚNG DẪN

## 📚 Mục Tiêu Week 1
- Hiểu khái niệm Docker Images vs Containers
- Nắm vững Dockerfile best practices
- Build & test Docker image locally
- Cải thiện Dockerfile hiện tại

---

## 1️⃣ PHẦN 1: DOCKER CONCEPTS (2-3 NGÀY)

### 1.1 Docker Images vs Containers

```
IMAGE (Blueprint)
├─ Read-only
├─ Layered architecture
├─ Có thể reuse nhiều lần
└─ Lưu trữ trên registry (Docker Hub, GitHub Container Registry)

CONTAINER (Running Instance)
├─ Write-able layer (COPY-ON-WRITE)
├─ Isolated process từ OS
├─ Temporary (xoá khi stop)
└─ Tách biệt với host system
```

**Ví dụ thực tế:**
```
Dockerfile (recipe)
    ↓
 docker build → IMAGE (template)
    ↓
 docker run → CONTAINER (running)
```

### 1.2 Dockerfile Layers

Mỗi command trong Dockerfile tạo ra 1 layer:

```dockerfile
FROM node:24-alpine          # Layer 1: Base OS
WORKDIR /app                 # Layer 2: Workspace
COPY package*.json ./        # Layer 3: Dependencies list
RUN npm ci                   # Layer 4: Install packages
COPY . .                     # Layer 5: Source code
EXPOSE 3000                  # Layer 6: Metadata
CMD ["npm", "start"]        # Layer 7: Default command
```

**Caching:**
- Docker cache từng layer
- Nếu layer không change, dùng cache lại
- Giúp build nhanh hơn

**Tối ưu:**
```dockerfile
# ✅ GOOD - Đặt ít thay đổi trước
COPY package*.json ./
RUN npm ci
COPY . .

# ❌ BAD - Tất cả change → tất cả layer rebuild
COPY . .
RUN npm ci
```

### 1.3 Docker Registry

- **Docker Hub**: Default public registry (https://hub.docker.com/)
- **GitHub Container Registry**: Private/Public per repo (ghcr.io)
- **Private Registry**: Setup riêng cho company

**Image Naming Convention:**
```
[registry]/[repository]/[image]:[tag]

Ví dụ:
- node:24-alpine (Docker Hub)
- ghcr.io/sang831/forgeflow:latest (GitHub)
- localhost:5000/myapp:v1.0 (Private)
```

---

## 2️⃣ PHẦN 2: DOCKERFILE BEST PRACTICES (1 NGÀY)

### 2.1 Dockerfile Comparison

**TRƯỚC (Basic):**
```dockerfile
FROM node:24
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

**SAU (Optimized):**
```dockerfile
# Multi-stage build
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:24-alpine
WORKDIR /app

# Non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs . .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000
USER nodejs
CMD ["npm", "start"]
```

### 2.2 Key Improvements

| Aspect | TRƯỚC | SAU | Lợi Ích |
|--------|------|-----|--------|
| **Base Image** | `node:24` (1GB) | `node:24-alpine` (200MB) | Nhỏ, nhanh hơn |
| **Install** | `npm install` | `npm ci` | Reproducible builds |
| **Multi-stage** | ❌ | ✅ | Final image không chứa build tools |
| **User** | root (❌ insecure) | nodejs user | Security |
| **Health Check** | ❌ | ✅ | Docker orchestration hỗ trợ auto-restart |
| **Layers** | Package + code cùng copy | Separate | Better caching |

### 2.3 Alpine vs Full Image

```
node:24         → 1.0 GB (Debian-based)
node:24-alpine  → 200 MB (musl-based)

⚠️ Lưu ý:
- Alpine không có glibc (dùng musl)
- Một số packages có thể không compatible
- Nhưng cho Node.js thì hoàn toàn OK
```

---

## 3️⃣ PHẦN 3: .dockerignore (1 NGÀY)

### 3.1 Tại sao cần .dockerignore?

```
Git build process:
folder/ ── .git/ (commit history) ── Dockerfile → ignore by .gitignore
         ── package.json
         └── node_modules/ ── COPY . . in Dockerfile → BUILD CONTEXT
                 ↓
            Docker COPY adds 500MB to build context!
```

### 3.2 .dockerignore vs .gitignore

```
.gitignore        → Git commits ignore
.dockerignore     → Docker build ignore

Ví dụ ForgeFlow:
.gitignore:
  node_modules/
  .env
  .DS_Store

.dockerignore:  (THÊM vào)
  node_modules/     ← Already ignored by npm ci
  npm-debug.log
  .git/             ← History không cần
  .gitignore
  README.md         ← Docs không cần
  docs/
  .vscode/          ← Config không cần
  .idea/
  .env              ← Already in .gitignore
  COVERAGE/
  build/
```

### 3.3 Impact

```bash
# TRƯỚC (with node_modules in build context)
docker build . → Build context: 500MB → Upload to Docker daemon
                  Build time: 5-10s

# SAU (with .dockerignore)
docker build . → Build context: 1-2MB
                  Build time: 1-2s
```

---

## 4️⃣ PHẦN 4: BUILD & TEST LOCALLY (2 NGÀY)

### 4.1 Step-by-Step Build Process

```bash
# Bước 1: Navigate to backend
cd app/backend

# Bước 2: Build image
docker build -t forgeflow-backend:latest .
# Output: 
# Step 1/15 : FROM node:24-alpine AS builder
# Step 2/15 : WORKDIR /app
# ...
# Successfully built abc123def456
# Successfully tagged forgeflow-backend:latest

# Bước 3: Verify image
docker images | grep forgeflow
# REPOSITORY            TAG      IMAGE ID      SIZE
# forgeflow-backend     latest   abc123def456  180MB

# Bước 4: Run container
docker run -d \
  --name backend-test \
  -p 3000:3000 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=forgeflow \
  -e DB_USER=forgeflow \
  -e DB_PASSWORD=forgeflow_password \
  forgeflow-backend:latest

# Output: 7f8a9b0c1d2e3f4g5h6i7j8k9l0m1n2o

# Bước 5: Check container is running
docker ps | grep backend
# CONTAINER ID    IMAGE                TAG       STATUS
# 7f8a9b0c1d2e    forgeflow-backend    latest    Up 2 seconds

# Bước 6: Check logs
docker logs backend-test
# ForgeFlow backend running on port 3000

# Bước 7: Test health endpoint
curl http://localhost:3000/health
# {"status":"ok","database":"connected"}  ✅
# or
# {"status":"error","database":"disconnected"}  (OK if no DB running)

# Bước 8: Inspect container
docker inspect backend-test
# Xem state, network, mounts, etc.

# Bước 9: Stop container
docker stop backend-test
# Output: backend-test

# Bước 10: Remove container
docker rm backend-test
# Output: backend-test

# Bước 11: Remove image (optional cleanup)
docker rmi forgeflow-backend:latest
```

### 4.2 Troubleshooting Common Issues

**Issue 1: Build fails - `npm: not found`**
```bash
# ❌ WRONG
FROM node:24  # Debian-based, npm there

# ✅ CORRECT
FROM node:24-alpine  # Alpine, npm included
```

**Issue 2: Container starts but immediately exits**
```bash
# Check logs
docker logs backend-test
# Error: Cannot find module 'express'

# Reason: npm ci missing in Dockerfile
# Fix: Ensure RUN npm ci in Dockerfile
```

**Issue 3: Port 3000 already in use**
```bash
# Option 1: Use different port
docker run -p 3001:3000 forgeflow-backend:latest

# Option 2: Kill existing container
docker stop $(docker ps -q --filter publish=3000)
```

**Issue 4: Database connection fails**
```bash
# This is EXPECTED if no PostgreSQL running
# Health endpoint still works

# If you want to test with DB:
docker-compose up  # (Week 2 topic)
```

**Issue 5: Permission denied (EACCES)**
```dockerfile
# ❌ Running as root (default)
CMD ["npm", "start"]  # runs as root

# ✅ Running as non-root user
USER nodejs
CMD ["npm", "start"]  # runs as nodejs user
```

### 4.3 Commands Cheat Sheet

```bash
# Build
docker build -t name:tag .
docker build -t name:tag --no-cache .  # Skip cache

# Run
docker run -d -p 3000:3000 --name container-name name:tag
docker run -it name:tag /bin/sh  # Interactive shell

# Manage
docker ps                    # List running containers
docker ps -a                 # List all containers
docker images                # List images
docker logs container-name   # View logs
docker inspect container-name # Full details
docker stats                 # Live stats

# Cleanup
docker stop container-name
docker rm container-name
docker rmi image-name
docker system prune          # Remove unused resources
```

---

## 5️⃣ PHẦN 5: IMPROVEMENTS TRONG PROJECT (1 NGÀY)

### 5.1 Thay đổi đã thực hiện

✅ **Dockerfile** (updated)
- Multi-stage build (builder + runtime)
- Alpine base image (lightweight)
- Non-root user (security)
- Health check (orchestration support)
- Proper layer ordering (caching)

✅ **.dockerignore** (created)
- Exclude node_modules (already installed)
- Exclude git history
- Exclude docs & config files
- Exclude build artifacts

### 5.2 Testing Checklist

- [ ] Build image successfully: `docker build -t forgeflow-backend:latest .`
- [ ] Container starts: `docker run -d --name test -p 3000:3000 forgeflow-backend:latest`
- [ ] Health endpoint responds: `curl http://localhost:3000/health`
- [ ] View logs: `docker logs test`
- [ ] Container is running as nodejs user: `docker inspect test` (check User)
- [ ] Stop and remove: `docker stop test && docker rm test`
- [ ] Cleanup image: `docker rmi forgeflow-backend:latest`

### 5.3 Next Steps (Week 2)

- [ ] Docker Networks (multiple containers)
- [ ] Docker Volumes (persistent data)
- [ ] docker-compose.yml (orchestration)
- [ ] Multi-container setup (backend + database)

---

## 📊 WEEK 1 SUMMARY

```
Khái niệm:
  ✅ Images (blueprints) vs Containers (instances)
  ✅ Layers & caching mechanism
  ✅ Best practices & security

Thực hành:
  ✅ Improved Dockerfile
  ✅ Added .dockerignore
  ✅ Built image locally
  ✅ Ran container with tests
  ✅ Troubleshot common issues

Hiểu được:
  ✅ Tại sao dùng Alpine
  ✅ Tại sao cần non-root user
  ✅ Tại sao cần health check
  ✅ Tại sao cần .dockerignore
  ✅ Cách debug Docker issues
```

---

## 🔗 USEFUL RESOURCES

- Docker Docs: https://docs.docker.com/
- Node.js + Docker: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
- Docker Best Practices: https://docs.docker.com/develop/dev-best-practices/
- Alpine Linux: https://alpinelinux.org/

---

**Status:** ✅ WEEK 1 COMPLETE - Ready for Week 2 (Docker Networks & Volumes)
