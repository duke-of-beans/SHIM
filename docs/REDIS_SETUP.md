# Redis Setup for SHIM

## Quick Start

**1. Install Docker Desktop**
- Download: https://www.docker.com/products/docker-desktop/
- Install and restart your computer
- Start Docker Desktop

**2. Start Redis**
```powershell
cd D:\SHIM
docker-compose up -d
```

**3. Verify Redis is running**
```powershell
docker ps
# Should show: shim-redis running on port 6379
```

**4. Test connection**
```powershell
docker exec -it shim-redis redis-cli ping
# Should return: PONG
```

---

## Configuration

**Redis Version:** 7.2-alpine (latest stable)  
**Port:** 6379 (default)  
**Memory Limit:** 256MB  
**Persistence:** AOF (Append-Only File) enabled  
**Eviction Policy:** allkeys-lru (Least Recently Used)

---

## Common Commands

**Start Redis:**
```powershell
docker-compose up -d
```

**Stop Redis:**
```powershell
docker-compose down
```

**View logs:**
```powershell
docker-compose logs -f redis
```

**Access Redis CLI:**
```powershell
docker exec -it shim-redis redis-cli
```

**Flush all data (CAUTION):**
```powershell
docker exec -it shim-redis redis-cli FLUSHALL
```

---

## Optional: RedisInsight GUI

RedisInsight provides a web-based GUI for Redis management.

**Start with RedisInsight:**
```powershell
docker-compose --profile tools up -d
```

**Access GUI:**
- Open browser to: http://localhost:8001
- Add database:
  - Host: redis (or host.docker.internal)
  - Port: 6379
  - Name: SHIM Local

---

## Troubleshooting

**Issue: "docker-compose: command not found"**
- Solution: Restart PowerShell after installing Docker Desktop
- OR use: `docker compose` (no hyphen, Docker Compose V2)

**Issue: Port 6379 already in use**
- Check if Redis already running: `netstat -ano | findstr :6379`
- Kill process or change port in docker-compose.yml

**Issue: Container won't start**
```powershell
# Check logs
docker-compose logs redis

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

**Issue: Permission denied**
- Run PowerShell as Administrator
- OR enable Docker Desktop to run without admin

---

## Data Persistence

Redis data is stored in a Docker volume: `redis-data`

**View volumes:**
```powershell
docker volume ls
```

**Backup data:**
```powershell
docker exec shim-redis redis-cli BGSAVE
```

**Restore data:**
- Stop container: `docker-compose down`
- Replace dump.rdb in volume
- Start container: `docker-compose up -d`

---

## Health Checks

Redis container includes automatic health checks:
- Pings every 10 seconds
- 3 second timeout
- 5 retries before marking unhealthy

**Check health:**
```powershell
docker inspect shim-redis | Select-String -Pattern "Health"
```

---

## Next Steps

After Redis is running:
1. Run SHIM tests: `npm test -- RedisConnectionManager`
2. Verify all Phase 2 infrastructure tests pass
3. Begin implementing supervisor components

---

*Redis setup complete! Container will auto-start with Docker Desktop.*
